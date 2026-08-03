import { ReactNode } from "react";

export default function CardHeader({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="border-b px-6 py-4">
            <h2 className="text-xl font-semibold">
                {children}
            </h2>
        </div>
    );
}