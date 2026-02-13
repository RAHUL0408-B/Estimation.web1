
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, limit } from "firebase/firestore";

const samplePortfolio = [
    {
        title: "Modern Minimalist Villa",
        category: "residential",
        description: "A complete renovation of a 3000 sqft villa focusing on open spaces, natural light, and a monochromatic color palette.",
        location: "Beverly Hills, CA",
        beforeImageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000",
        afterImageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 0
    },
    {
        title: "Tech Startup Office",
        category: "commercial",
        description: "Designing a collaborative workspace for a growing tech company, featuring pods, breakout areas, and ergonomic furniture.",
        location: "San Francisco, CA",
        beforeImageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
        afterImageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 1
    },
    {
        title: "Luxury Penthouse",
        category: "residential",
        description: "An ultra-luxury penthouse design with premium materials, smart home integration, and panoramic city views.",
        location: "New York, NY",
        beforeImageUrl: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=1000",
        afterImageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 2
    },
    {
        title: "Cozy Urban Apartment",
        category: "residential",
        description: "Maximizing space in a compact city apartment with multi-functional furniture and warm textures.",
        location: "London, UK",
        beforeImageUrl: "https://images.unsplash.com/photo-1484154218962-a1c002085ea9?auto=format&fit=crop&q=80&w=1000",
        afterImageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 3
    },
    {
        title: "Boutique Coffee Shop",
        category: "commercial",
        description: "A rustic-industrial interior for a specialty coffee shop, creating a welcoming and warm atmosphere.",
        location: "Seattle, WA",
        beforeImageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000",
        afterImageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000",
        showOnHomepage: true,
        order: 4
    }
];

const sampleTestimonials = [
    {
        clientName: "Sarah Johnson",
        clientTitle: "Homeowner",
        clientImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
        reviewText: "Absolutely transformed our living space! The team was professional, creative, and attentive to every detail. We couldn't be happier with the result.",
        rating: 5,
        showOnHomepage: true,
        order: 0
    },
    {
        clientName: "Michael Chen",
        clientTitle: "CEO, TechFlow",
        clientImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
        reviewText: "They understood our company culture perfectly and designed an office that boosts productivity and morale. Highly recommended for commercial projects.",
        rating: 5,
        showOnHomepage: true,
        order: 1
    },
    {
        clientName: "Emily Davis",
        clientTitle: "Apartment Owner",
        clientImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        reviewText: "Working with the team was a breeze. They handled everything from design to execution, and the final look is straight out of a magazine.",
        rating: 4,
        showOnHomepage: true,
        order: 2
    }
];

const sampleTeamMembers = [
    {
        name: "Alex Morgan",
        role: "Principal Architect",
        bio: "With over 15 years of experience, Alex leads our design team with a vision for sustainable and timeless architecture.",
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=500",
        linkedinUrl: "https://linkedin.com",
        instagramUrl: "https://instagram.com",
        showOnHomepage: true,
        order: 0
    },
    {
        name: "Jessica Lee",
        role: "Senior Interior Designer",
        bio: "Jessica has a knack for color and texture, creating warm and inviting spaces that reflect our clients' personalities.",
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=500",
        linkedinUrl: "https://linkedin.com",
        instagramUrl: "https://instagram.com",
        showOnHomepage: true,
        order: 1
    },
    {
        name: "David Smith",
        role: "Project Manager",
        bio: "David ensures every project runs smoothly, on time, and within budget, handling all the logistics and coordination.",
        imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=500",
        linkedinUrl: "https://linkedin.com",
        instagramUrl: "https://instagram.com",
        showOnHomepage: true,
        order: 2
    }
];

export const generateSampleData = async (tenantId: string) => {
    if (!tenantId) return;

    try {
        // 1. Check & Generate Portfolio
        const portfolioRef = collection(db, "tenants", tenantId, "portfolio");
        const portfolioSnap = await getDocs(query(portfolioRef, limit(1)));

        if (portfolioSnap.empty) {
            console.log("Generating sample portfolio...");
            const promises = samplePortfolio.map(item =>
                addDoc(portfolioRef, { ...item, createdAt: serverTimestamp() })
            );
            await Promise.all(promises);
        }

        // 2. Check & Generate Testimonials
        const testimonialsRef = collection(db, "tenants", tenantId, "testimonials");
        const testimonialsSnap = await getDocs(query(testimonialsRef, limit(1)));

        if (testimonialsSnap.empty) {
            console.log("Generating sample testimonials...");
            const promises = sampleTestimonials.map(item =>
                addDoc(testimonialsRef, { ...item, createdAt: serverTimestamp() })
            );
            await Promise.all(promises);
        }

        // 3. Check & Generate Team Members
        const teamRef = collection(db, "tenants", tenantId, "pages", "about", "teamMembers");
        const teamSnap = await getDocs(query(teamRef, limit(1)));

        if (teamSnap.empty) {
            console.log("Generating sample team members...");
            const promises = sampleTeamMembers.map(item =>
                addDoc(teamRef, { ...item, createdAt: serverTimestamp() })
            );
            await Promise.all(promises);
        }

    } catch (error) {
        console.error("Error generating sample data:", error);
    }
};
