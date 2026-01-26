import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface EstimateData {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    carpetArea: number;
    rooms: string[];
    materialGrade: string;
    finishType: string;
    totalAmount: number;
    formData?: any;
    createdAt: any;
}

export async function generateEstimatePDF(
    estimateId: string,
    companyName: string = "Interior Design Co.",
    options: { download?: boolean; uploadToStorage?: boolean } = { download: true, uploadToStorage: true }
): Promise<{ success: boolean; pdfUrl?: string }> {
    try {
        // Fetch estimate data from Firestore
        const estimateRef = doc(db, "estimates", estimateId);
        const estimateSnap = await getDoc(estimateRef);

        if (!estimateSnap.exists()) {
            throw new Error("Estimate not found");
        }

        const estimateData = estimateSnap.data() as EstimateData;

        // Create PDF
        const pdf = new jsPDF();

        // Company Name Header
        pdf.setFontSize(18);
        pdf.setTextColor(30, 30, 30);
        pdf.text(companyName, 105, 15, { align: "center" });

        // Divider line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(14, 20, 196, 20);

        // Title
        pdf.setFontSize(16);
        pdf.setTextColor(60, 60, 60);
        pdf.text("Estimate Breakdown", 105, 30, { align: "center" });

        // Estimate Info
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Estimate ID: ${estimateId.slice(0, 12)}`, 14, 40);
        pdf.text(`Date: ${estimateData.createdAt?.toDate ? estimateData.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}`, 14, 45);

        // Client Information Section
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Client Information", 14, 55);

        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Name: ${estimateData.clientName}`, 14, 62);
        pdf.text(`Phone: ${estimateData.clientPhone || "N/A"}`, 14, 67);

        // Project Details Section
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Project Details", 14, 80);

        const projectDetails: any[] = [
            ['Carpet Area', `${estimateData.carpetArea} sqft`],
            ['Rooms', estimateData.rooms.join(", ") || "N/A"],
            ['Material Grade', estimateData.materialGrade],
            ['Finish Type', estimateData.finishType]
        ];

        // Add living area options if available
        if (estimateData.formData?.livingAreaOptions) {
            const selectedOptions = Object.entries(estimateData.formData.livingAreaOptions)
                .filter(([_, selected]) => selected)
                .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

            if (selectedOptions.length > 0) {
                projectDetails.push(['Living Area Options', selectedOptions.join(", ")]);
            }
        }

        // Add kitchen details if available
        if (estimateData.formData?.kitchen) {
            const kitchen = estimateData.formData.kitchen;
            if (kitchen.layout && kitchen.woodType) {
                projectDetails.push(['Kitchen', `${kitchen.layout} - ${kitchen.woodType}`]);
            }
            if (kitchen.addOns && kitchen.addOns.length > 0) {
                projectDetails.push(['Kitchen Add-ons', kitchen.addOns.join(", ")]);
            }
        }

        // Add bedroom details if available
        if (estimateData.formData?.bedrooms) {
            const bedrooms = estimateData.formData.bedrooms;
            let bedroomDetails = `${bedrooms.count || 0} Bedroom(s)`;
            if (bedrooms.hasMaster) bedroomDetails += ", Master BR";
            if (bedrooms.hasWardrobe) bedroomDetails += ", Wardrobe";
            if (bedrooms.hasStudyUnit) bedroomDetails += ", Study Unit";
            projectDetails.push(['Bedrooms', bedroomDetails]);
        }

        autoTable(pdf, {
            startY: 85,
            head: [['Item', 'Details']],
            body: projectDetails,
            theme: 'plain',
            headStyles: {
                fillColor: [245, 245, 245],
                textColor: [60, 60, 60],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                textColor: [80, 80, 80],
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            }
        });

        // Cost Summary Section
        const finalY = (pdf as any).lastAutoTable.finalY + 15;

        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        pdf.text("Cost Summary", 14, finalY);

        // Cost box
        pdf.setFillColor(248, 248, 248);
        pdf.rect(14, finalY + 5, 182, 25, 'F');

        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text("Estimated Total Cost:", 20, finalY + 15);

        pdf.setFontSize(18);
        pdf.setTextColor(30, 30, 30);
        pdf.text(`₹ ${estimateData.totalAmount.toLocaleString('en-IN')}`, 20, finalY + 25);

        // Footer note
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text("Note: This is an approximate estimate. Final quote may vary based on site conditions and material availability.", 14, finalY + 40, { maxWidth: 180 });

        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Generated by Interior Estimation System", 105, 285, { align: "center" });

        // Generate filename
        const clientNameSlug = (estimateData.clientName || 'estimate').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `estimate_${clientNameSlug}_${dateStr}.pdf`;

        let pdfUrl: string | undefined;

        // Upload to Firebase Storage if enabled
        if (options.uploadToStorage) {
            try {
                const pdfBlob = pdf.output("blob");
                const storageRef = ref(storage, `estimates/${estimateId}.pdf`);
                await uploadBytes(storageRef, pdfBlob);
                pdfUrl = await getDownloadURL(storageRef);

                // Find and update the order document with pdfUrl
                const ordersRef = collection(db, "orders");
                const orderQuery = query(ordersRef, where("estimateId", "==", estimateId));
                const orderSnapshot = await getDocs(orderQuery);

                if (!orderSnapshot.empty) {
                    const orderDoc = orderSnapshot.docs[0];
                    await updateDoc(doc(db, "orders", orderDoc.id), { pdfUrl });
                }
            } catch (uploadError) {
                console.error("Error uploading PDF to storage:", uploadError);
                // Continue with download even if upload fails
            }
        }

        // Download locally if enabled
        if (options.download) {
            pdf.save(filename);
        }

        return { success: true, pdfUrl };
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}
