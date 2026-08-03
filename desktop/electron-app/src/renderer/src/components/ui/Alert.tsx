import clsx from "clsx";

interface Props {
    children: React.ReactNode;
    type?: "success" | "error" | "warning";
}

export default function Alert({
    children,
    type = "success",
}: Props) {
    return (
        <div
            className={clsx(
                "rounded-lg p-3 text-sm",
                {
                    "bg-green-100 text-green-700":
                        type === "success",

                    "bg-red-100 text-red-700":
                        type === "error",

                    "bg-yellow-100 text-yellow-700":
                        type === "warning",
                }
            )}
        >
            {children}
        </div>
    );
}