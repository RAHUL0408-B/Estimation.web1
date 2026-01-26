"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Calculator, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { getTenantByStoreId, Tenant } from "@/lib/firestoreHelpers";
import { generateEstimatePDF } from "@/lib/generateEstimatePdf";
import { useUserRole } from "@/hooks/useUserRole";

declare module "jspdf" {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export default function EstimatorPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: tenantSlug } = use(params); // This is the URL slug (storeId)
    const router = useRouter();

    // Resolve tenant document ID from slug
    const [resolvedTenant, setResolvedTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);

    useEffect(() => {
        const resolveTenant = async () => {
            try {
                const tenant = await getTenantByStoreId(tenantSlug);
                setResolvedTenant(tenant);
            } catch (error) {
                console.error("Error resolving tenant:", error);
            } finally {
                setTenantLoading(false);
            }
        };
        resolveTenant();
    }, [tenantSlug]);

    // Use resolved tenant ID for pricing config (document ID, not slug)
    const { config, loading: pricingLoading } = usePricingConfig(resolvedTenant?.id || null);
    const { customer, loading: authLoading, isAdmin } = useCustomerAuth();

    // Role-based check - but DON'T redirect admins, just show them the form
    const { roleData, loading: roleLoading } = useUserRole();

    // Combined loading state
    const loading = tenantLoading || pricingLoading || authLoading || roleLoading;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !customer && !isAdmin) {
            router.push(`/${tenantSlug}/login?redirect=/${tenantSlug}/estimate`);
        }
    }, [loading, customer, isAdmin, router, tenantSlug]);

    const [step, setStep] = useState(1);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
    const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Basic inputs
    const [carpetArea, setCarpetArea] = useState("");
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedFinish, setSelectedFinish] = useState<string | null>(null);

    // Living area selections
    const [livingAreaSelections, setLivingAreaSelections] = useState<Record<string, boolean>>({});

    // Kitchen selections
    const [selectedWoodType, setSelectedWoodType] = useState<string | null>(null);
    const [selectedKitchenLayout, setSelectedKitchenLayout] = useState<string | null>(null);
    const [selectedKitchenAddOns, setSelectedKitchenAddOns] = useState<string[]>([]);

    // Bedroom selections
    const [selectedBedroomCount, setSelectedBedroomCount] = useState<number | null>(null);
    const [hasMasterBedroom, setHasMasterBedroom] = useState(false);
    const [hasWardrobe, setHasWardrobe] = useState(false);
    const [hasStudyUnit, setHasStudyUnit] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState(0);

    const toggleLivingAreaOption = (key: string) => {
        setLivingAreaSelections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleKitchenAddOn = (id: string) => {
        setSelectedKitchenAddOns(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const calculateEstimate = () => {
        if (!config || !carpetArea || !selectedGrade || !selectedFinish) {
            return 0;
        }

        const area = parseFloat(carpetArea);
        if (isNaN(area) || area <= 0) return 0;

        let total = 0;

        // Base calculation
        const baseRatePerSqft = 500;
        total = area * baseRatePerSqft;

        // Living area add-ons
        if (config.livingArea) {
            Object.entries(config.livingArea).forEach(([key, option]) => {
                if (livingAreaSelections[key] && option.enabled) {
                    total += option.price;
                }
            });
        }

        // Kitchen
        if (config.kitchen && selectedKitchenLayout && selectedWoodType) {
            const layout = config.kitchen.layouts.find(l => l.id === selectedKitchenLayout);
            const woodType = config.kitchen.woodTypes.find(w => w.id === selectedWoodType);

            if (layout && woodType) {
                total += layout.basePrice * woodType.multiplier;
            }

            // Kitchen add-ons
            selectedKitchenAddOns.forEach(addonId => {
                const addon = config.kitchen!.addOns.find(a => a.id === addonId);
                if (addon) {
                    total += addon.price;
                }
            });
        }

        // Bedrooms
        if (config.bedrooms && selectedBedroomCount !== null) {
            const bedroomConfig = config.bedrooms.counts.find(c => c.count === selectedBedroomCount);
            if (bedroomConfig) {
                total += bedroomConfig.basePrice;
            }

            if (hasMasterBedroom && config.bedrooms.masterBedroom.enabled) {
                total += config.bedrooms.masterBedroom.additionalPrice;
            }

            if (hasWardrobe && config.bedrooms.wardrobe.enabled) {
                total += config.bedrooms.wardrobe.pricePerBedroom * selectedBedroomCount;
            }

            if (hasStudyUnit && config.bedrooms.studyUnit.enabled) {
                total += config.bedrooms.studyUnit.pricePerUnit;
            }
        }

        // Material grade multiplier
        const grade = config.materialGrades.find(g => g.id === selectedGrade);
        if (grade) {
            total *= grade.multiplier;
        }

        // Finish multiplier
        const finish = config.finishTypes.find(f => f.id === selectedFinish);
        if (finish) {
            total *= finish.multiplier;
        }

        return Math.round(total);
    };

    const performSubmission = async (cost: number) => {
        setEstimatedCost(cost);
        setIsSubmitting(true);

        try {
            // Use already resolved tenant instead of fetching again
            const tenantDetails = resolvedTenant;
            const grade = config?.materialGrades.find(g => g.id === selectedGrade);
            const finish = config?.finishTypes.find(f => f.id === selectedFinish);

            // Get user data from multiple sources to ensure we have client info
            // Priority: 1. Customer object, 2. Users collection (roleData), 3. Firebase Auth
            const currentUser = auth.currentUser;
            let userData = {
                name: customer?.displayName || "",
                phone: customer?.phoneNumber || "",
                email: customer?.email || "",
                uid: customer?.uid || currentUser?.uid || ""
            };

            // If customer data is missing, try to fetch from users collection
            if (!userData.name && currentUser?.uid) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userRecord = userDoc.data();
                        userData = {
                            name: userRecord.name || userRecord.displayName || currentUser.displayName || "",
                            phone: userRecord.phone || userRecord.phoneNumber || currentUser.phoneNumber || "",
                            email: userRecord.email || currentUser.email || "",
                            uid: currentUser.uid
                        };
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            }

            // Fallback to Firebase Auth data
            if (!userData.name && currentUser) {
                userData.name = currentUser.displayName || currentUser.email?.split('@')[0] || "";
                userData.email = currentUser.email || "";
                userData.phone = currentUser.phoneNumber || "";
            }

            // Build kitchen data
            let kitchenData = null;
            if (selectedKitchenLayout && selectedWoodType) {
                const layout = config?.kitchen?.layouts.find(l => l.id === selectedKitchenLayout);
                const woodType = config?.kitchen?.woodTypes.find(w => w.id === selectedWoodType);
                kitchenData = {
                    layout: layout?.name || "",
                    woodType: woodType?.name || "",
                    addOns: selectedKitchenAddOns.map(id =>
                        config?.kitchen?.addOns.find(a => a.id === id)?.name || ""
                    )
                };
            }

            // Build rooms array from selections
            const rooms: string[] = [];
            if (config?.livingArea) {
                Object.entries(livingAreaSelections).forEach(([key, selected]) => {
                    if (selected) {
                        rooms.push(key.replace(/([A-Z])/g, ' $1').trim());
                    }
                });
            }
            if (selectedBedroomCount) {
                rooms.push(`${selectedBedroomCount} Bedroom(s)`);
            }

            // STEP 1: Create estimate document
            const estimateData = {
                clientName: userData.name,
                clientPhone: userData.phone,
                clientEmail: userData.email,
                carpetArea: parseFloat(carpetArea),
                rooms: rooms,
                materialGrade: grade?.name || "",
                finishType: finish?.name || "",
                totalAmount: cost,
                companyId: tenantDetails?.ownerUid || "",
                tenantId: tenantDetails?.id || "",
                createdByUserId: userData.uid,
                createdByRole: isAdmin ? "admin" : "customer",
                formData: {
                    carpetArea: parseFloat(carpetArea),
                    livingAreaOptions: livingAreaSelections,
                    kitchen: kitchenData,
                    bedrooms: {
                        count: selectedBedroomCount,
                        hasMaster: hasMasterBedroom,
                        hasWardrobe: hasWardrobe,
                        hasStudyUnit: hasStudyUnit
                    },
                    materialGrade: grade?.name || "",
                    finish: finish?.name || ""
                },
                breakdown: {
                    carpetArea: parseFloat(carpetArea),
                    gradeMultiplier: grade?.multiplier || 1,
                    finishMultiplier: finish?.multiplier || 1
                },
                createdAt: serverTimestamp()
            };

            // Save estimate
            const estimateRef = await addDoc(collection(db, "estimates"), estimateData);
            const estimateId = estimateRef.id;

            // STEP 2: Create order document with estimateId reference
            const orderData = {
                estimateId: estimateId,
                clientName: userData.name,
                clientPhone: userData.phone,
                clientEmail: userData.email,
                estimatedAmount: cost,
                status: "pending",
                companyId: tenantDetails?.ownerUid || "",
                tenantId: tenantDetails?.id || "", // Document ID
                storeId: tenantSlug, // Store slug (URL param)
                createdByUserId: userData.uid,
                createdByRole: isAdmin ? "admin" : "customer",

                // Additional data for display
                carpetArea: parseFloat(carpetArea),
                rooms: rooms,
                materialGrade: grade?.name || "",
                finishType: finish?.name || "",

                createdAt: serverTimestamp()
            };

            // Save order
            const orderRef = await addDoc(collection(db, "orders"), orderData);

            setCurrentOrderId(orderRef.id);
            setCurrentEstimateId(estimateId); // Store for PDF generation
            setStep(2);
        } catch (error: any) {
            alert(`Failed to save estimate: ${error.message || 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const generatePDF = async () => {
        if (!currentEstimateId) {
            alert("Estimate ID not found. Please try again.");
            return;
        }

        setIsGeneratingPDF(true);
        try {
            // Use already resolved tenant for company name
            const companyName = resolvedTenant?.businessName || "Interior Design Co.";

            await generateEstimatePDF(currentEstimateId, companyName);
        } catch (error: any) {
            alert(`Failed to generate PDF: ${error.message || 'Please try again.'}`);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleCalculate = async () => {
        const cost = calculateEstimate();
        if (cost === 0) {
            alert("Please fill all required fields");
            return;
        }

        // User is guaranteed to be authenticated (checked on page load)
        // Submit estimate to database
        await performSubmission(cost);
    };

    // Show loading while checking auth or if redirecting
    if (loading || (!customer && !isAdmin)) {
        return (
            <div className="container mx-auto max-w-5xl px-4 py-12 flex items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="container mx-auto max-w-5xl px-4 py-12 text-center">
                <p className="text-muted-foreground">Pricing configuration not available.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Get Estimate</h1>
                <p className="text-gray-600 text-sm font-medium">STEP {step} OF 2</p>
            </div>

            <Card className="shadow-lg">
                {step === 1 && (
                    <>
                        <CardHeader>
                            <CardTitle className="text-2xl text-gray-900">Project Inputs</CardTitle>
                            <CardDescription className="text-gray-600">Configure your space and material preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Carpet Area */}
                            <div className="space-y-3">
                                <Label htmlFor="carpetArea" className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                    Carpet Area (SQFT)
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="carpetArea"
                                        type="number"
                                        placeholder="Enter your carpet area (sqft)"
                                        value={carpetArea}
                                        onChange={(e) => setCarpetArea(e.target.value)}
                                        className="text-2xl font-bold h-14 text-gray-900"
                                        min="100"
                                        max="10000"
                                    />
                                    <span className="text-lg text-gray-500">SQFT</span>
                                </div>
                            </div>

                            {/* Living Area Options */}
                            {config.livingArea && (
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                        Living Area Options
                                    </Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(config.livingArea).map(([key, option]) => {
                                            if (!option.enabled) return null;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleLivingAreaOption(key)}
                                                    className={cn(
                                                        "flex flex-col items-start p-4 rounded-lg border-2 transition-all",
                                                        livingAreaSelections[key]
                                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-medium text-sm capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        {livingAreaSelections[key] && (
                                                            <Check className="h-5 w-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1">₹{option.price.toLocaleString()}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Kitchen Configuration */}
                            {config.kitchen && (
                                <div className="space-y-6">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                        Kitchen Configuration
                                    </Label>

                                    {/* Wood Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-700">Wood Type</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {config.kitchen.woodTypes.filter(w => w.enabled).map((woodType) => (
                                                <button
                                                    key={woodType.id}
                                                    type="button"
                                                    onClick={() => setSelectedWoodType(woodType.id)}
                                                    className={cn(
                                                        "p-3 rounded-lg border-2 transition-all text-center text-sm",
                                                        selectedWoodType === woodType.id
                                                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    {woodType.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kitchen Layout */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-700">Kitchen Layout</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {config.kitchen.layouts.filter(l => l.enabled).map((layout) => (
                                                <button
                                                    key={layout.id}
                                                    type="button"
                                                    onClick={() => setSelectedKitchenLayout(layout.id)}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-lg border-2 transition-all",
                                                        selectedKitchenLayout === layout.id
                                                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    <span className="text-sm">{layout.name}</span>
                                                    <span className="text-xs text-gray-500 mt-1">₹{layout.basePrice.toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kitchen Add-ons */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-700">Add-ons (Optional)</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {config.kitchen.addOns.filter(a => a.enabled).map((addon) => (
                                                <button
                                                    key={addon.id}
                                                    type="button"
                                                    onClick={() => toggleKitchenAddOn(addon.id)}
                                                    className={cn(
                                                        "flex flex-col items-start p-3 rounded-lg border-2 transition-all",
                                                        selectedKitchenAddOns.includes(addon.id)
                                                            ? "border-blue-600 bg-blue-50 text-blue-900"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="text-sm">{addon.name}</span>
                                                        {selectedKitchenAddOns.includes(addon.id) && (
                                                            <Check className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1">₹{addon.price.toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bedroom Configuration */}
                            {config.bedrooms && (
                                <div className="space-y-6">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                        Bedroom Configuration
                                    </Label>

                                    {/* Bedroom Count */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-700">Number of Bedrooms</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {config.bedrooms.counts.filter(c => c.enabled).map((bc) => (
                                                <button
                                                    key={bc.count}
                                                    type="button"
                                                    onClick={() => setSelectedBedroomCount(bc.count)}
                                                    className={cn(
                                                        "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                                                        selectedBedroomCount === bc.count
                                                            ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                                            : "border-gray-200 bg-white hover:border-gray-300"
                                                    )}
                                                >
                                                    <span className="text-lg font-bold">{bc.count}</span>
                                                    <span className="text-xs text-gray-500 mt-1">₹{bc.basePrice.toLocaleString()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bedroom Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {config.bedrooms.masterBedroom.enabled && (
                                            <button
                                                type="button"
                                                onClick={() => setHasMasterBedroom(!hasMasterBedroom)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                                    hasMasterBedroom
                                                        ? "border-blue-600 bg-blue-50 text-blue-900"
                                                        : "border-gray-200 bg-white hover:border-gray-300"
                                                )}
                                            >
                                                <span className="text-sm">Master BR</span>
                                                {hasMasterBedroom && <Check className="h-4 w-4 text-blue-600" />}
                                            </button>
                                        )}
                                        {config.bedrooms.wardrobe.enabled && (
                                            <button
                                                type="button"
                                                onClick={() => setHasWardrobe(!hasWardrobe)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                                    hasWardrobe
                                                        ? "border-blue-600 bg-blue-50 text-blue-900"
                                                        : "border-gray-200 bg-white hover:border-gray-300"
                                                )}
                                            >
                                                <span className="text-sm">Wardrobe</span>
                                                {hasWardrobe && <Check className="h-4 w-4 text-blue-600" />}
                                            </button>
                                        )}
                                        {config.bedrooms.studyUnit.enabled && (
                                            <button
                                                type="button"
                                                onClick={() => setHasStudyUnit(!hasStudyUnit)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                                                    hasStudyUnit
                                                        ? "border-blue-600 bg-blue-50 text-blue-900"
                                                        : "border-gray-200 bg-white hover:border-gray-300"
                                                )}
                                            >
                                                <span className="text-sm">Study Unit</span>
                                                {hasStudyUnit && <Check className="h-4 w-4 text-blue-600" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Grade */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                    Material Grade
                                </Label>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                                    {config.materialGrades.filter(g => g.enabled !== false).map((grade) => (
                                        <button
                                            key={grade.id}
                                            type="button"
                                            onClick={() => setSelectedGrade(grade.id)}
                                            className={cn(
                                                "p-4 rounded-lg border-2 transition-all text-center",
                                                selectedGrade === grade.id
                                                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            )}
                                        >
                                            {grade.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Finish */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold uppercase tracking-wider text-gray-800">
                                    Finish Type
                                </Label>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                                    {config.finishTypes.filter(f => f.enabled !== false).map((finish) => (
                                        <button
                                            key={finish.id}
                                            type="button"
                                            onClick={() => setSelectedFinish(finish.id)}
                                            className={cn(
                                                "p-4 rounded-lg border-2 transition-all text-center",
                                                selectedFinish === finish.id
                                                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            )}
                                        >
                                            {finish.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calculate Button */}
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg bg-gray-900 hover:bg-gray-800"
                                onClick={handleCalculate}
                                disabled={isSubmitting || !carpetArea || !selectedGrade || !selectedFinish}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Calculating...
                                    </>
                                ) : (
                                    <>
                                        Calculate Estimate <Calculator className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </>
                )}

                {step === 2 && (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                        <div className="mb-6">
                            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-4xl font-serif">Estimated Cost</CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Based on your project requirements
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="max-w-md space-y-6">
                            <div className="mb-4 flex items-baseline justify-center gap-2">
                                <span className="text-2xl text-muted-foreground">₹</span>
                                <span className="text-6xl font-bold tracking-tight text-primary">
                                    {estimatedCost.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-left space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Carpet Area:</span>
                                    <span className="font-semibold">{carpetArea} sqft</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Grade:</span>
                                    <span className="font-semibold">{config.materialGrades.find(g => g.id === selectedGrade)?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Finish:</span>
                                    <span className="font-semibold">{config.finishTypes.find(f => f.id === selectedFinish)?.name}</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Your estimate has been saved. Our team will contact you at <strong>{customer?.email || auth.currentUser?.email || "your registered email"}</strong> to discuss your project.
                            </p>

                            <div className="flex flex-col gap-3 mt-6">
                                {currentEstimateId && (
                                    <Button
                                        size="lg"
                                        onClick={generatePDF}
                                        variant="outline"
                                        className="w-full"
                                        disabled={isGeneratingPDF}
                                    >
                                        {isGeneratingPDF ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating PDF...
                                            </>
                                        ) : (
                                            "Download Price Breakdown (PDF)"
                                        )}
                                    </Button>
                                )}

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setStep(1);
                                        setCarpetArea("");
                                        setSelectedGrade(null);
                                        setSelectedFinish(null);
                                        setLivingAreaSelections({});
                                        setSelectedWoodType(null);
                                        setSelectedKitchenLayout(null);
                                        setSelectedKitchenAddOns([]);
                                        setSelectedBedroomCount(null);
                                        setHasMasterBedroom(false);
                                        setHasWardrobe(false);
                                        setHasStudyUnit(false);
                                    }}
                                    className="text-gray-500 mt-2"
                                >
                                    Start New Estimate
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                )}
            </Card>
        </div>
    );
}
