"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StorePage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="mb-8 font-serif text-4xl font-bold">Furniture Collection</h1>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <Card key={item} className="overflow-hidden">
                        <div className="h-48 bg-stone-100 flex items-center justify-center text-muted-foreground">
                            Product Image {item}
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold">Modern Sofa {item}</h3>
                            <p className="text-sm text-muted-foreground mb-4">Premium fabric, teak wood.</p>
                            <Button className="w-full">Add to Cart</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
