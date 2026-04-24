'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Swal from 'sweetalert2';

import { Button } from '@/components/ui/button';

type RegisterErrors = {
    email?: string;
    password?: string;
    form?: string;
};

type RegisterResponse = {
    message?: string;
};

const EMAIL_MAX_LENGTH = 255;

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getErrorMessage(payload: unknown, fallback: string): string {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof (payload as RegisterResponse).message === 'string'
    ) {
        return (payload as RegisterResponse).message ?? fallback;
    }

    return fallback;
}

async function readResponseJson<T>(response: Response): Promise<T | null> {
    const rawBody = await response.text();

    if (!rawBody.trim()) {
        return null;
    }

    try {
        return JSON.parse(rawBody) as T;
    } catch {
        return null;
    }
}

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<RegisterErrors>({});
    const router = useRouter();

    function validateForm(): boolean {
        const nextErrors: RegisterErrors = {};
        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            nextErrors.email = 'El correo electrónico es obligatorio.';
        } else if (normalizedEmail.length > EMAIL_MAX_LENGTH) {
            nextErrors.email = `El correo no puede superar ${EMAIL_MAX_LENGTH} caracteres.`;
        } else if (!isValidEmail(normalizedEmail)) {
            nextErrors.email = 'Ingresa un correo electrónico válido.';
        }

        if (!password) {
            nextErrors.password = 'La contraseña es obligatoria.';
        } else if (password.length < 6) {
            nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await readResponseJson<RegisterResponse>(res);

            if (!res.ok) {
                throw new Error(getErrorMessage(data, 'No fue posible registrar el usuario.'));
            }

            await Swal.fire({
                title: 'Usuario registrado',
                text: 'Ahora puedes iniciar sesión con tu cuenta.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });

            router.push('/login');
            setErrors({});
            setEmail('');
            setPassword('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Ocurrió un problema';
            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Reintentar',
            });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-white/45">Registro</p>
                <h2 className="text-2xl font-semibold text-white">Crea tu cuenta</h2>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Correo Electrónico</label>
                <input
                    type="email"
                    maxLength={EMAIL_MAX_LENGTH}
                    placeholder="ejemplo@correo.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/60 p-3 text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:bg-black/80"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email ? <p className="text-sm text-red-400">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Contraseña</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-black/60 p-3 text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:bg-black/80"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {errors.password ? <p className="text-sm text-red-400">{errors.password}</p> : null}
            </div>

            <Button type="submit" className="mt-2 w-full rounded-2xl">
                Registrarme
            </Button>

            <div className="text-center mt-2">
                <p className="text-sm text-white/55">
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" className="font-medium text-white underline underline-offset-4 transition hover:text-white/75">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </form>
    );
}
