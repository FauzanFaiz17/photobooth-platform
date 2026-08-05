import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import { mockTemplates } from "@/features/template/mockTemplates";
import { useSessionStore } from "@/store/sessionStore";

export default function TemplatePage() {

    const navigate = useNavigate();

    const setTemplate = useSessionStore((state) => state.setTemplate);

    function handleSelect(templateId: string) {

        const template = mockTemplates.find((t) => t.id === templateId);

        if (!template) {

            return;

        }

        setTemplate(template);

        navigate("/filter");

    }

    return (

        <div className="flex h-full flex-col gap-6">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">Pilih Template</h1>

                <p className="text-slate-500">Pilih layout foto yang kamu suka.</p>

            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">

                {mockTemplates.map((template) => (

                    <button
                        key={template.id}
                        onClick={() => handleSelect(template.id)}
                        className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >

                        <div
                            className="flex h-40 w-full items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: template.previewColor }}
                        >

                            <span className="text-sm font-medium opacity-80">

                                {template.slots} foto

                            </span>

                        </div>

                        <span className="font-semibold text-slate-700">

                            {template.name}

                        </span>

                    </button>

                ))}

            </div>

            <div className="mt-auto flex justify-start">

                <Button
                    onClick={() => navigate("/dashboard")}
                    className="bg-slate-500 hover:bg-slate-600"
                >

                    Batal

                </Button>

            </div>

        </div>

    );

}
