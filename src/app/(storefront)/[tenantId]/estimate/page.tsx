"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Loader2, CheckCircle2, Plus, Minus, Download, Home, Building2, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePricingConfig, PricingItem } from "@/hooks/usePricingConfig";
import { useCities } from "@/hooks/useCities";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getTenantByStoreId, Tenant } from "@/lib/firestoreHelpers";
import { generateEstimatePDF } from "@/lib/generateEstimatePdf";

type Plan = 'Basic' | 'Standard' | 'Luxe';

interface ItemQuantity {
    [itemId: string]: number;
}

interface BedroomConfig {
    items: ItemQuantity;
}

interface BathroomConfig {
    items: ItemQuantity;
}

export default function EstimatorPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId: tenantSlug } = use(params);
    const router = useRouter();


    // Resolve tenant
    const [resolvedTenant, setResolvedTenant] = useState<Tenant | null>(null);
    const [tenantLoading, setTenantLoading] = useState(true);

    useEffect(() => {
        const resolveTenant = async () => {
            if (!tenantSlug) return;
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

    const { config, loading: pricingLoading } = usePricingConfig(resolvedTenant?.id || null);
    const { cities, loading: citiesLoading } = useCities(resolvedTenant?.id || null);
    const { customer, loading: authLoading, isAdmin } = useCustomerAuth();

    const loading = tenantLoading || pricingLoading || citiesLoading;

    // NOTE: Removed auth guard - guests can now access estimate page
    // Auth check moved to handleSubmit function

    const [step, setStep] = useState(1);
    const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Customer Info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    // Project Details
    const [segment, setSegment] = useState<'Residential' | 'Commercial'>('Residential');
    const [selectedPlan, setSelectedPlan] = useState<Plan>('Standard');
    const [carpetArea, setCarpetArea] = useState("");
    const [bedroomCount, setBedroomCount] = useState(0);
    const [bathroomCount, setBathroomCount] = useState(0);

    // Item Selections
    const [livingAreaItems, setLivingAreaItems] = useState<ItemQuantity>({});
    const [kitchenLayout, setKitchenLayout] = useState("");
    const [kitchenMaterial, setKitchenMaterial] = useState("");
    const [kitchenItems, setKitchenItems] = useState<ItemQuantity>({});
    const [bedrooms, setBedrooms] = useState<BedroomConfig[]>([]);
    const [bathrooms, setBathrooms] = useState<BathroomConfig[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedTotal, setEstimatedTotal] = useState(0);
    const [breakdown, setBreakdown] = useState<any[]>([]);

    // Update bedroom/bathroom arrays when counts change
    useEffect(() => {
        const count = Math.max(0, bedroomCount);
        if (count > bedrooms.length) {
            setBedrooms(prev => [...prev, ...Array(count - prev.length).fill({ items: {} })]);
        } else if (count < bedrooms.length) {
            setBedrooms(prev => prev.slice(0, count));
        }
    }, [bedroomCount]);

    useEffect(() => {
        const count = Math.max(0, bathroomCount);
        if (count > bathrooms.length) {
            setBathrooms(prev => [...prev, ...Array(count - prev.length).fill({ items: {} })]);
        } else if (count < bathrooms.length) {
            setBathrooms(prev => prev.slice(0, count));
        }
    }, [bathroomCount]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    // Auto-submit after login if there's pending estimate data
    useEffect(() => {
        const checkPendingEstimate = async () => {
            // Check URL params for autoSubmit flag
            const urlParams = new URLSearchParams(window.location.search);
            const shouldAutoSubmit = urlParams.get('autoSubmit') === 'true';

            if (shouldAutoSubmit && (customer || isAdmin)) {
                // User just logged in, check for pending estimate
                const pendingData = sessionStorage.getItem('pendingEstimate');

                if (pendingData) {
                    try {
                        const formData = JSON.parse(pendingData);

                        // Restore form state
                        setCustomerName(formData.customerInfo.name);
                        setCustomerPhone(formData.customerInfo.phone);
                        setCustomerEmail(formData.customerInfo.email);
                        setSelectedCity(formData.customerInfo.city);
                        setSegment(formData.segment);
                        setSelectedPlan(formData.plan);
                        setCarpetArea(formData.carpetArea.toString());
                        setBedroomCount(formData.bedrooms);
                        setBathroomCount(formData.bathrooms);
                        setLivingAreaItems(formData.configuration.livingArea);
                        setKitchenLayout(formData.configuration.kitchen.layout);
                        setKitchenMaterial(formData.configuration.kitchen.material);
                        setKitchenItems(formData.configuration.kitchen.items);
                        setBedrooms(formData.configuration.bedrooms);
                        setBathrooms(formData.configuration.bathrooms);

                        // Wait a moment for state to update, then submit
                        setTimeout(() => {
                            handleSubmit();
                            // Clean up URL
                            window.history.replaceState({}, '', `/${tenantSlug}/estimate`);
                        }, 500);
                    } catch (error) {
                        console.error('Error restoring pending estimate:', error);
                        sessionStorage.removeItem('pendingEstimate');
                    }
                }
            }
        };

        if (!authLoading) {
            checkPendingEstimate();
        }
    }, [customer, isAdmin, authLoading]);

    const isStepValid = () => {
        if (step === 1) return true;
        if (step === 2) return true;
        if (step === 3) return carpetArea && parseFloat(carpetArea) > 0;
        if (step === 4) return true;
        if (step === 5) return customerName && customerPhone && customerEmail && selectedCity;
        return false;
    };

    const updateItemQuantity = (
        category: 'livingArea' | 'kitchen' | 'bedroom' | 'bathroom',
        itemId: string,
        delta: number,
        index?: number
    ) => {
        if (category === 'livingArea') {
            setLivingAreaItems(prev => ({
                ...prev,
                [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
            }));
        } else if (category === 'kitchen') {
            setKitchenItems(prev => ({
                ...prev,
                [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
            }));
        } else if (category === 'bedroom' && index !== undefined) {
            setBedrooms(prev => {
                const newBedrooms = [...prev];
                newBedrooms[index] = {
                    ...newBedrooms[index],
                    items: {
                        ...newBedrooms[index].items,
                        [itemId]: Math.max(0, (newBedrooms[index].items[itemId] || 0) + delta)
                    }
                };
                return newBedrooms;
            });
        } else if (category === 'bathroom' && index !== undefined) {
            setBathrooms(prev => {
                const newBathrooms = [...prev];
                newBathrooms[index] = {
                    ...newBathrooms[index],
                    items: {
                        ...newBathrooms[index].items,
                        [itemId]: Math.max(0, (newBathrooms[index].items[itemId] || 0) + delta)
                    }
                };
                return newBathrooms;
            });
        }
    };

    const calculateEstimate = () => {
        if (!config?.categories) return { total: 0, breakdown: [] };

        const area = parseFloat(carpetArea) || 0;
        let total = 0;
        const breakdown: any[] = [];

        const priceKey = selectedPlan === 'Basic' ? 'basicPrice' : selectedPlan === 'Standard' ? 'standardPrice' : 'luxePrice';

        // Helper to calculate item cost
        const calculateItemCost = (item: PricingItem, quantity: number) => {
            if (item.type === 'fixed') {
                return item[priceKey];
            } else if (item.type === 'perUnit') {
                return quantity * item[priceKey];
            } else if (item.type === 'perSqft') {
                return area * quantity * item[priceKey];
            }
            return 0;
        };

        // Living Area
        const livingAreaCategory = config.categories.find(c => c.id === 'living_area');
        if (livingAreaCategory) {
            Object.entries(livingAreaItems).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    const item = livingAreaCategory.items.find(i => i.id === itemId);
                    if (item && item.enabled) {
                        const cost = calculateItemCost(item, quantity);
                        total += cost;
                        breakdown.push({
                            category: 'Living Area',
                            item: item.name,
                            quantity,
                            unitPrice: item[priceKey],
                            total: cost
                        });
                    }
                }
            });
        }

        // Kitchen
        const kitchenCategory = config.categories.find(c => c.id === 'kitchen');
        if (kitchenCategory) {
            Object.entries(kitchenItems).forEach(([itemId, quantity]) => {
                if (quantity > 0) {
                    const item = kitchenCategory.items.find(i => i.id === itemId);
                    if (item && item.enabled) {
                        const cost = calculateItemCost(item, quantity);
                        total += cost;
                        breakdown.push({
                            category: 'Kitchen',
                            item: item.name,
                            quantity,
                            unitPrice: item[priceKey],
                            total: cost
                        });
                    }
                }
            });
        }

        // Bedrooms
        const bedroomCategory = config.categories.find(c => c.id === 'bedroom');
        if (bedroomCategory) {
            bedrooms.forEach((bedroom, index) => {
                Object.entries(bedroom.items).forEach(([itemId, quantity]) => {
                    if (quantity > 0) {
                        const item = bedroomCategory.items.find(i => i.id === itemId);
                        if (item && item.enabled) {
                            const cost = calculateItemCost(item, quantity);
                            total += cost;
                            breakdown.push({
                                category: `Bedroom ${index + 1}`,
                                item: item.name,
                                quantity,
                                unitPrice: item[priceKey],
                                total: cost
                            });
                        }
                    }
                });
            });
        }

        // Bathrooms
        const bathroomCategory = config.categories.find(c => c.id === 'bathroom');
        if (bathroomCategory) {
            bathrooms.forEach((bathroom, index) => {
                Object.entries(bathroom.items).forEach(([itemId, quantity]) => {
                    if (quantity > 0) {
                        const item = bathroomCategory.items.find(i => i.id === itemId);
                        if (item && item.enabled) {
                            const cost = calculateItemCost(item, quantity);
                            total += cost;
                            breakdown.push({
                                category: `Bathroom ${index + 1}`,
                                item: item.name,
                                quantity,
                                unitPrice: item[priceKey],
                                total: cost
                            });
                        }
                    }
                });
            });
        }

        return { total, breakdown };
    };

    const handleSubmit = async () => {
        // Validation
        if (!customerName || !customerPhone || !customerEmail || !selectedCity) {
            alert("Please fill in all customer information fields");
            return;
        }
        if (!carpetArea || parseFloat(carpetArea) <= 0) {
            alert("Please enter a valid carpet area");
            return;
        }

        // Check if user is authenticated
        if (!customer && !isAdmin) {
            // User is not logged in - save form data to sessionStorage
            const formData = {
                customerInfo: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    city: selectedCity
                },
                segment,
                plan: selectedPlan,
                carpetArea: parseFloat(carpetArea),
                bedrooms: bedroomCount,
                bathrooms: bathroomCount,
                configuration: {
                    livingArea: livingAreaItems,
                    kitchen: {
                        layout: kitchenLayout,
                        material: kitchenMaterial,
                        items: kitchenItems
                    },
                    bedrooms: bedrooms,
                    bathrooms: bathrooms
                },
                tenantId: resolvedTenant?.id,
                tenantSlug: tenantSlug
            };

            // Save to sessionStorage
            sessionStorage.setItem('pendingEstimate', JSON.stringify(formData));

            // Redirect to login with return URL
            router.push(`/${tenantSlug}/login?redirect=/${tenantSlug}/estimate&autoSubmit=true`);
            return;
        }

        // User is logged in - proceed with submission
        setIsSubmitting(true);

        try {
            const { total, breakdown } = calculateEstimate();

            // Save to Firestore
            const estimateData = {
                customerInfo: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    city: selectedCity
                },
                segment,
                plan: selectedPlan,
                carpetArea: parseFloat(carpetArea),
                bedrooms: bedroomCount,
                bathrooms: bathroomCount,
                configuration: {
                    livingArea: livingAreaItems,
                    kitchen: {
                        layout: kitchenLayout,
                        material: kitchenMaterial,
                        items: kitchenItems
                    },
                    bedrooms: bedrooms,
                    bathrooms: bathrooms
                },
                totalAmount: total,
                tenantId: resolvedTenant?.id,
                customerId: customer?.uid || null,
                createdAt: serverTimestamp()
            };

            const estimatesRef = collection(db, `tenants/${resolvedTenant?.id}/estimates`);
            const docRef = await addDoc(estimatesRef, estimateData);

            setCurrentEstimateId(docRef.id);
            setEstimatedTotal(total);
            setBreakdown(breakdown);
            setStep(6);

            // Clear sessionStorage if it exists
            sessionStorage.removeItem('pendingEstimate');
        } catch (error) {
            console.error("Error submitting estimate:", error);
            alert("Failed to submit estimate. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!currentEstimateId) return;
        setIsGeneratingPDF(true);
        try {
            await generateEstimatePDF(currentEstimateId, resolvedTenant?.businessName || "Company");
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0F172A]" />
            </div>
        );
    }

    if (step === 6) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
                <div className="max-w-3xl w-full">
                    <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="text-center pb-8 pt-12 bg-white">
                            <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-green-50">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <CardTitle className="text-4xl font-bold text-[#0F172A] mb-2 tracking-tight">
                                Estimate Ready!
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-500">
                                Your detailed project estimate has been generated
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-12 bg-gray-50/50 p-8">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
                                <p className="text-sm font-medium mb-2 opacity-90 uppercase tracking-widest">Total Project Cost</p>
                                <p className="text-6xl font-bold tracking-tight">₹ {estimatedTotal.toLocaleString('en-IN')}</p>
                                <p className="text-sm mt-3 opacity-80 font-medium bg-white/20 inline-block px-3 py-1 rounded-full">{selectedPlan} Plan</p>
                            </div>

                            {breakdown.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-xl text-[#0F172A] px-1">Detailed Breakdown</h3>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                                        <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {breakdown.map((item, index) => (
                                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="p-4 text-sm font-medium text-gray-900">{item.category}</td>
                                                            <td className="p-4 text-sm text-gray-600">{item.item}</td>
                                                            <td className="p-4 text-sm text-right text-gray-600">{item.quantity}</td>
                                                            <td className="p-4 text-sm text-right text-gray-600">₹ {item.unitPrice.toLocaleString('en-IN')}</td>
                                                            <td className="p-4 text-sm text-right font-bold text-gray-900">₹ {item.total.toLocaleString('en-IN')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPDF}
                                    className="flex-1 bg-[#0F172A] hover:bg-[#1E293B] text-white py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    {isGeneratingPDF ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Generating PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-5 w-5" />
                                            Download Breakdown PDF
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStep(1);
                                        setCurrentEstimateId(null);
                                        setEstimatedTotal(0);
                                        setBreakdown([]);
                                    }}
                                    variant="outline"
                                    className="flex-1 py-7 text-lg rounded-xl border-2 hover:bg-gray-50 transition-all"
                                >
                                    Start New Estimate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const livingAreaCategory = config?.categories?.find(c => c.id === 'living_area');
    const kitchenCategory = config?.categories?.find(c => c.id === 'kitchen');
    const bedroomCategory = config?.categories?.find(c => c.id === 'bedroom');
    const bathroomCategory = config?.categories?.find(c => c.id === 'bathroom');

    const enabledCities = cities.filter(c => c.enabled);

    const { total: currentTotal } = calculateEstimate();

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans pt-4 pb-32 relative z-0">
            {/* Minimal Header Removed to allow Main Layout Header */}

            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Progress Indicators */}
                <div className="flex justify-center mb-12">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500 ease-out",
                                    step === s ? "w-8 bg-black" : step > s ? "w-8 bg-black/20" : "w-1.5 bg-gray-200"
                                )}
                            />
                        ))}
                    </div>
                </div>
                {/* Step 1: Segment */}
                {step === 1 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                        <div className="space-y-3 text-center">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Project Type</h1>
                            <p className="text-xl text-gray-500 font-light">What kind of space are we designing today?</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {['Residential', 'Commercial'].map((s) => (
                                <div
                                    key={s}
                                    onClick={() => setSegment(s as any)}
                                    className={cn(
                                        "cursor-pointer group relative overflow-hidden rounded-3xl border-2 p-10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",
                                        segment === s
                                            ? "border-black bg-white ring-4 ring-black/5 shadow-xl"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className="space-y-6 flex flex-col items-center">
                                        <div className={cn(
                                            "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                                            segment === s ? "bg-black text-white scale-110" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:scale-110"
                                        )}>
                                            {s === 'Residential' ? <Home className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                                        </div>
                                        <h3 className="text-3xl font-bold tracking-tight">{s}</h3>
                                        <p className="text-center text-gray-500 leading-relaxed px-4">
                                            {s === 'Residential' ? 'Homes, Apartments, and Villas' : 'Offices, Retail, and Workspaces'}
                                        </p>
                                    </div>
                                    {segment === s && (
                                        <div className="absolute top-6 right-6 text-black bg-black/5 rounded-full p-1">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Plan */}
                {step === 2 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                        <div className="text-center space-y-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Select Plan</h1>
                            <p className="text-xl text-gray-500 font-light">Choose a tier that matches your vision</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(['Basic', 'Standard', 'Luxe'] as Plan[]).map(plan => (
                                <button
                                    key={plan}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={cn(
                                        "relative p-8 border-2 rounded-3xl text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group flex flex-col justify-center min-h-[240px]",
                                        selectedPlan === plan
                                            ? "border-black bg-white ring-4 ring-black/5 shadow-xl scale-[1.02]"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className="space-y-4">
                                        <div className={cn(
                                            "inline-flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-2",
                                            selectedPlan === plan ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {plan === 'Basic' && 'Essential'}
                                            {plan === 'Standard' && 'Popular'}
                                            {plan === 'Luxe' && 'Premium'}
                                        </div>
                                        <p className="font-bold text-3xl text-[#0F172A]">{plan}</p>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {plan === 'Basic' && 'Perfect for simple updates'}
                                            {plan === 'Standard' && 'Balanced design & quality'}
                                            {plan === 'Luxe' && 'Top-tier finishes & customized'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Project Basics */}
                {step === 3 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                        <div className="text-center space-y-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Project Basics</h1>
                            <p className="text-xl text-gray-500 font-light">Tell us about the space dimensions</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Carpet Area (sqft)</Label>
                                <Input
                                    type="number"
                                    placeholder="e.g 1200"
                                    className="h-16 text-2xl font-light bg-gray-50 border-0 focus:ring-2 focus:ring-black/5 rounded-2xl transition-all pl-6"
                                    value={carpetArea}
                                    onChange={(e) => setCarpetArea(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Bedrooms</Label>
                                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-2 h-16">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-white shadow-sm" onClick={() => setBedroomCount(Math.max(0, bedroomCount - 1))}><Minus className="h-5 w-5" /></Button>
                                    <div className="flex-1 text-center font-bold text-2xl">{bedroomCount}</div>
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-white shadow-sm" onClick={() => setBedroomCount(bedroomCount + 1)}><Plus className="h-5 w-5" /></Button>
                                </div>
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Bathrooms</Label>
                                <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-2 h-16 w-full md:w-2/3 mx-auto">
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-white shadow-sm" onClick={() => setBathroomCount(Math.max(0, bathroomCount - 1))}><Minus className="h-5 w-5" /></Button>
                                    <div className="flex-1 text-center font-bold text-2xl">{bathroomCount}</div>
                                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-white shadow-sm" onClick={() => setBathroomCount(bathroomCount + 1)}><Plus className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Essentials Configuration */}
                {step === 4 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                        <div className="text-center space-y-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Configure Details</h1>
                            <p className="text-xl text-gray-500 font-light">Customize essentials for each room</p>
                        </div>

                        <div className="space-y-16">
                            {/* Living Area */}
                            {livingAreaCategory && livingAreaCategory.items.filter(i => i.enabled).length > 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                        <div className="h-10 w-1 bg-black rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#0F172A]">Living Area</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {livingAreaCategory.items.filter(i => i.enabled).map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-6 border border-gray-100 bg-white rounded-2xl hover:shadow-lg transition-all duration-300">
                                                <span className="font-semibold text-lg text-gray-700">{item.name}</span>
                                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                        onClick={() => updateItemQuantity('livingArea', item.id, -1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-bold text-lg">{livingAreaItems[item.id] || 0}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                        onClick={() => updateItemQuantity('livingArea', item.id, 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Kitchen */}
                            {kitchenCategory && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                        <div className="h-10 w-1 bg-black rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#0F172A]">Kitchen</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-3">
                                            <Label className="uppercase text-xs font-bold text-gray-400">Layout</Label>
                                            <Select value={kitchenLayout} onValueChange={setKitchenLayout}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-white border border-gray-200 text-lg">
                                                    <SelectValue placeholder="Select layout" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {config?.kitchenLayouts?.filter(l => l.enabled).map(layout => (
                                                        <SelectItem key={layout.id} value={layout.name}>{layout.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="uppercase text-xs font-bold text-gray-400">Material</Label>
                                            <Select value={kitchenMaterial} onValueChange={setKitchenMaterial}>
                                                <SelectTrigger className="h-14 rounded-2xl bg-white border border-gray-200 text-lg">
                                                    <SelectValue placeholder="Select material" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {config?.kitchenMaterials?.filter(m => m.enabled).map(material => (
                                                        <SelectItem key={material.id} value={material.name}>{material.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {kitchenCategory.items.filter(i => i.enabled).length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {kitchenCategory.items.filter(i => i.enabled).map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-6 border border-gray-100 bg-white rounded-2xl hover:shadow-lg transition-all duration-300">
                                                    <span className="font-semibold text-lg text-gray-700">{item.name}</span>
                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                            onClick={() => updateItemQuantity('kitchen', item.id, -1)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="w-8 text-center font-bold text-lg">{kitchenItems[item.id] || 0}</span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm"
                                                            onClick={() => updateItemQuantity('kitchen', item.id, 1)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bedrooms */}
                            {bedroomCount > 0 && bedroomCategory && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                        <div className="h-10 w-1 bg-black rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#0F172A]">Bedrooms</h2>
                                    </div>
                                    {bedrooms.map((bedroom, index) => (
                                        <div key={index} className="space-y-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                            <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest mb-4">Bedroom {index + 1}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {bedroomCategory.items.filter(i => i.enabled).map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-5 border border-gray-100 bg-white rounded-2xl hover:border-gray-300 transition-colors">
                                                        <span className="font-medium">{item.name}</span>
                                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateItemQuantity('bedroom', item.id, -1, index)}><Minus className="h-3 w-3" /></Button>
                                                            <span className="w-6 text-center font-bold text-sm">{bedroom.items[item.id] || 0}</span>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateItemQuantity('bedroom', item.id, 1, index)}><Plus className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Bathrooms */}
                            {bathroomCount > 0 && bathroomCategory && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                                        <div className="h-10 w-1 bg-black rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-[#0F172A]">Bathrooms</h2>
                                    </div>
                                    {bathrooms.map((bathroom, index) => (
                                        <div key={index} className="space-y-4 p-8 bg-gray-50/50 rounded-3xl border border-gray-100">
                                            <h3 className="font-bold text-lg text-gray-400 uppercase tracking-widest mb-4">Bathroom {index + 1}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {bathroomCategory.items.filter(i => i.enabled).map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-5 border border-gray-100 bg-white rounded-2xl hover:border-gray-300 transition-colors">
                                                        <span className="font-medium">{item.name}</span>
                                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateItemQuantity('bathroom', item.id, -1, index)}><Minus className="h-3 w-3" /></Button>
                                                            <span className="w-6 text-center font-bold text-sm">{bathroom.items[item.id] || 0}</span>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white hover:shadow-sm" onClick={() => updateItemQuantity('bathroom', item.id, 1, index)}><Plus className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Submit */}
                {step === 5 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                        <div className="text-center space-y-3">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Final Review</h1>
                            <p className="text-xl text-gray-500 font-light">Confirm your details and receive estimate</p>
                        </div>

                        <div className="bg-black rounded-3xl p-10 text-white text-center shadow-2xl transform hover:scale-[1.01] transition-transform duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <p className="text-gray-400 font-bold mb-3 uppercase tracking-widest text-xs">Estimated Cost</p>
                                <div className="text-6xl font-bold mb-3 tracking-tight">₹ {currentTotal.toLocaleString('en-IN')}</div>
                                <p className="text-sm opacity-60 font-medium">Based on {selectedPlan} Plan</p>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-lg border-b border-gray-100 pb-4 text-gray-900">Customer Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Phone</Label>
                                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="+91 98765 43210" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Email</Label>
                                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-bold uppercase text-gray-500">City</Label>
                                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                                        <SelectTrigger className="h-14 bg-gray-50 border-0 rounded-xl px-4 text-lg"><SelectValue placeholder="Select City" /></SelectTrigger>
                                        <SelectContent>
                                            {enabledCities.map(city => (<SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
                    <Button
                        variant="ghost"
                        disabled={step === 1}
                        onClick={() => setStep(s => s - 1)}
                        className="text-gray-500 hover:text-black font-semibold h-12 px-6 rounded-xl hover:bg-gray-100"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                    </Button>

                    {step < 5 ? (
                        <Button
                            className="bg-black text-white hover:bg-gray-800 rounded-full px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepValid()}
                        >
                            Continue <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            className="bg-black text-white hover:bg-gray-800 rounded-full px-10 py-7 text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isStepValid()}
                        >
                            {isSubmitting ? <><Loader2 className="mr-2 animate-spin" /> Submitting...</> : "Confirm & Submit"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
