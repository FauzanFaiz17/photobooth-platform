import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CardHeader from "@/components/ui/CardHeader";
import CardBody from "@/components/ui/CardBody";
import CardFooter from "@/components/ui/CardFooter";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";

import { useLogin } from "@/features/auth/hooks/useLogin";

export default function LoginForm() {

    const { loading, handleLogin } = useLogin();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        try {

            const result = await handleLogin(
                email,
                password
            );

            console.log(result);

        } catch (err) {

            console.error(err);

        }

    };

    return (

        <form onSubmit={handleSubmit}>

            <Card className="w-full max-w-md">

                <CardHeader>
                    Login
                </CardHeader>

                <CardBody>

                    <div>

                        <Label>Email</Label>

                        <Input
                            type="email"
                            placeholder="Masukkan email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <Label>Password</Label>

                        <Input
                            type="password"
                            placeholder="Masukkan password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                        />

                    </div>

                </CardBody>

                <CardFooter>

                    <Button
                        loading={loading}
                        type="submit"
                        className="w-full"
                    >
                        Masuk
                    </Button>

                </CardFooter>

            </Card>

        </form>

    );

}