"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PortfolioProject } from "@/types/website";

interface PortfolioCardProps {
    project: PortfolioProject;
    index: number;
}


export default function PortfolioCard({ project, index }: PortfolioCardProps) {
    const [view, setView] = useState<'after' | 'before'>('after');

    // Determine style, defaulting to 'single' if undefined (even if both images exist)
    const imageStyle = project.imageStyle || "single";
    const isComparison = imageStyle === "before_after";
    const hasBeforeAndAfter = project.beforeImageUrl && project.afterImageUrl;

    // For single image, use afterImageUrl (Project Image) or fallback to beforeImageUrl
    const displayImage = isComparison
        ? (view === 'after' ? (project.afterImageUrl || project.beforeImageUrl) : (project.beforeImageUrl || project.afterImageUrl))
        : (project.afterImageUrl || project.beforeImageUrl);

    return (
        <div
            className="group relative overflow-hidden rounded-3xl bg-white shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-gray-100"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="aspect-[4/3] overflow-hidden relative">
                <img
                    src={displayImage}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {isComparison && hasBeforeAndAfter && (
                    <div className="absolute bottom-4 right-4 flex bg-black/50 backdrop-blur-md rounded-full p-1 z-10">
                        <button
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${view === 'before' ? 'bg-white text-black shadow-sm' : 'text-white hover:text-gray-200'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                setView('before');
                            }}
                        >
                            Before
                        </button>
                        <button
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${view === 'after' ? 'bg-white text-black shadow-sm' : 'text-white hover:text-gray-200'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                setView('after');
                            }}
                        >
                            After
                        </button>
                    </div>
                )}

                <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black font-semibold shadow-sm hover:bg-white uppercase tracking-wider text-[10px] px-2 py-0.5">
                        {project.category}
                    </Badge>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    <span>{project.location}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-gray-700 transition-colors">
                    {project.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {project.description}
                </p>
            </div>
        </div>
    );
}
