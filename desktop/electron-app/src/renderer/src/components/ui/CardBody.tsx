import { ReactNode } from "react";

export default function CardBody({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="space-y-4 p-6">
            {children}
        </div>
    );
}