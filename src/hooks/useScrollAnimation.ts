"use client";

import { useEffect, useState } from "react";

export function useScrollAnimation(dependencies: any[] = []) {
    const [elements, setElements] = useState<Element[]>([]);

    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            const observerElements = document.querySelectorAll("[data-scroll-animate]");
            setElements(Array.from(observerElements));

            if (observerElements.length === 0) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("scroll-animate-active");
                            observer.unobserve(entry.target); // Once animated, stop observing
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: "0px 0px -50px 0px",
                }
            );

            observerElements.forEach((el) => observer.observe(el));

            return () => {
                observer.disconnect();
            };
        }, 100);

        return () => clearTimeout(timeoutId);
    }, dependencies); // Re-run when dependencies change

    return elements;
}
