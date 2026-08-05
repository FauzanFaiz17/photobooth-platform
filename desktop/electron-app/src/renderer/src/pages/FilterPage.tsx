import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "@/components/ui/Button";

import { mockFilters } from "@/features/filter/mockFilters";
import { useSessionStore } from "@/store/sessionStore";

export default function FilterPage() {

    const navigate = useNavigate();

    const template = useSessionStore((state) => state.template);

    const setFilter = useSessionStore((state) => state.setFilter);

    useEffect(() => {

        // jangan biarkan user masuk ke halaman ini tanpa pilih template dulu
        if (!template) {

            navigate("/template", { replace: true });

        }

    }, [template, navigate]);

    function handleSelect(filterId: string) {

        const filter = mockFilters.find((f) => f.id === filterId) ?? null;

        setFilter(filter);

        navigate("/camera");

    }

    if (!template) {

        return null;

    }

    return (

        <div className="flex h-full flex-col gap-6">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">Pilih Filter</h1>

                <p className="text-slate-500">Template: {template.name}</p>

            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">

                {mockFilters.map((filter) => (

                    <button
                        key={filter.id}
                        onClick={() => handleSelect(filter.id)}
                        className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >

                        <div
                            className="h-28 w-full rounded-lg bg-gradient-to-br from-slate-400 to-slate-600"
                            style={{ filter: filter.cssFilter }}
                        />

                        <span className="font-semibold text-slate-700">

                            {filter.name}

                        </span>

                    </button>

                ))}

            </div>

            <div className="mt-auto flex justify-start">

                <Button
                    onClick={() => navigate("/template")}
                    className="bg-slate-500 hover:bg-slate-600"
                >

                    Kembali

                </Button>

            </div>

        </div>

    );

}
