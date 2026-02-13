
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, limit } from "firebase/firestore";

const SAMPLE_PROJECTS = [
    {
        title: "Modern Kitchen Renovation",
        location: "Mumbai",
        category: "Residential",
        description: "A complete overhaul of a 150 sqft kitchen with modular fittings, quartz countertops, and smart storage solutions.",
        imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 0
    },
    {
        title: "Luxury Villa Living Room",
        location: "Pune",
        category: "Residential",
        description: "Elegant living space design featuring Italian marble flooring, custom furniture, and ambient lighting.",
        imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 1
    },
    {
        title: "Minimal Apartment Bedroom",
        location: "Bangalore",
        category: "Residential",
        description: "Serene bedroom design with a monochromatic palette, platform bed, and maximize natural light.",
        imageUrl: "https://images.unsplash.com/photo-1616594039964-40891a90c3ea?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: false,
        order: 2
    }
];

const SAMPLE_TESTIMONIALS = [
    {
        clientName: "Rahul Sharma",
        role: "Homeowner",
        content: "Absolutely transformed our home! The team was professional, timely, and the design exceeded our expectations.",
        rating: 5,
        imageUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        showOnHomepage: true,
        order: 0
    },
    {
        clientName: "Priya Patel",
        role: "Interior Enthusiast",
        content: "Great attention to detail. They really listened to what we wanted and delivered a beautiful, functional space.",
        rating: 5,
        imageUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        showOnHomepage: true,
        order: 1
    },
    {
        clientName: "Amit Verma",
        role: "Software Engineer",
        content: "Highly recommend! The estimation tool was accurate, and the execution was flawless. Very happy with the result.",
        rating: 4,
        imageUrl: "https://randomuser.me/api/portraits/men/85.jpg",
        showOnHomepage: false,
        order: 2
    }
];

export async function checkAndSeed(tenantId: string) {
    if (!tenantId) return;

    try {
        // Check and Seed Portfolio
        const portfolioRef = collection(db, "tenants", tenantId, "pages", "portfolio", "projects");
        const portfolioSnap = await getDocs(query(portfolioRef, limit(1)));

        if (portfolioSnap.empty) {
            console.log("Seeding sample portfolio...");
            const promises = SAMPLE_PROJECTS.map(project =>
                addDoc(portfolioRef, {
                    ...project,
                    createdAt: serverTimestamp()
                })
            );
            await Promise.all(promises);
        }

        // Check and Seed Testimonials
        const testimonialsRef = collection(db, "tenants", tenantId, "pages", "testimonials", "items");
        const testimonialsSnap = await getDocs(query(testimonialsRef, limit(1)));

        if (testimonialsSnap.empty) {
            console.log("Seeding sample testimonials...");
            const promises = SAMPLE_TESTIMONIALS.map(testimonial =>
                addDoc(testimonialsRef, {
                    ...testimonial,
                    createdAt: serverTimestamp()
                })
            );
            await Promise.all(promises);
        }

    } catch (error) {
        console.error("Error seeding data:", error);
    }
}
