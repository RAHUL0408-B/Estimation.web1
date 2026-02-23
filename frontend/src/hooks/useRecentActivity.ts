"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "@/lib/firebaseWrapper";
import { Activity, formatRelativeTime } from "@/lib/firestoreHelpers";

export interface ActivityWithTime extends Activity {
    relativeTime: string;
}

export function useRecentActivity(maxItems: number = 10) {
    const [activities, setActivities] = useState<ActivityWithTime[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const activitiesRef = collection(db, "activities");
        const q = query(
            activitiesRef,
            orderBy("createdAt", "desc"),
            limit(maxItems)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activityList: ActivityWithTime[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data() as Omit<Activity, 'id'>;
                activityList.push({
                    id: doc.id,
                    ...data,
                    relativeTime: data.createdAt ? formatRelativeTime(data.createdAt) : "Unknown",
                });
            });

            setActivities(activityList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [maxItems]);

    return { activities, loading };
}
