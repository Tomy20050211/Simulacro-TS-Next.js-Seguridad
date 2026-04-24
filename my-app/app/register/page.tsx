import RegisterForm from '@/app/components/ui/registerForm';
import { Card } from '@/components/ui/card';

export default function RegisterPage() {
    return (
        <main className="min-h-[calc(100vh-72px)] bg-black px-4 py-12 text-white">
            <Card className="mx-auto w-full max-w-md p-8">
                <RegisterForm />
            </Card>
        </main>
    );
}
