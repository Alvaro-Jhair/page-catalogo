"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/login/actions";

type LoginFormProps = {
  next: string;
};

const initialState: LoginState = {};

export default function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <input type="hidden" name="next" value={next} />
      <label>
        Usuario
        <input type="text" name="username" autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.error && <p className="admin-login-error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
