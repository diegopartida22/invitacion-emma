"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const INITIAL: LoginState = { error: null };
const LENGTH = 4;
const SLOTS = Array.from({ length: LENGTH }, (_, i) => i);

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, INITIAL);
  const [digits, setDigits] = useState<string[]>(() => Array(LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const pin = digits.join("");
  const complete = pin.length === LENGTH;

  // Un PIN equivocado deja las casillas llenas y sin foco: se vacían para que
  // el siguiente intento no obligue a borrar a mano.
  //
  // La dependencia es `state`, no `state.error`: dos intentos fallidos seguidos
  // devuelven el mismo texto, y comparando la cadena el efecto no volvería a
  // correr. Cada envío devuelve un objeto nuevo, así que la identidad sí cambia.
  useEffect(() => {
    if (!state.error) return;
    setDigits(Array(LENGTH).fill(""));
    inputs.current[0]?.focus();
  }, [state]);

  const write = (values: string[], focusIndex: number) => {
    setDigits(values);
    inputs.current[Math.min(focusIndex, LENGTH - 1)]?.focus();

    // Enviar en cuanto se completa evita el botón de más. `requestSubmit`
    // pasa por el form y por tanto por la Server Action.
    if (values.every((d) => d !== "")) {
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    }
  };

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    // Pegar el PIN completo cae aquí como una sola cadena: se reparte.
    const next = [...digits];
    for (let i = 0; i < typed.length && index + i < LENGTH; i++) {
      next[index + i] = typed[i]!;
    }
    write(next, index + typed.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      // Si la casilla ya está vacía, el borrado se lleva la anterior.
      const target = next[index] ? index : Math.max(0, index - 1);
      next[target] = "";
      setDigits(next);
      inputs.current[target]?.focus();
      return;
    }
    if (e.key === "ArrowLeft") inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight") inputs.current[index + 1]?.focus();
  };

  return (
    <form ref={formRef} action={formAction} className="mt-7">
      <input type="hidden" name="pin" value={pin} />

      <div className="mb-[10px] text-center text-[12px] text-sienna">
        Tu PIN de {LENGTH} dígitos
      </div>

      <div className="flex justify-center gap-[10px]" role="group" aria-label="PIN de acceso">
        {SLOTS.map((i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            // `inputMode` abre el teclado numérico del celular; `type=text`
            // (en vez de number) evita las flechitas y el scroll que cambia
            // el valor sin querer.
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={LENGTH}
            aria-label={`Dígito ${i + 1}`}
            autoFocus={i === 0}
            disabled={pending}
            className="h-[62px] w-[54px] rounded-[14px] border border-gold/50 bg-cream text-center font-serif text-[30px] font-semibold text-cocoa caret-clay outline-none focus:border-clay focus:ring-2 focus:ring-clay/25 disabled:opacity-60"
          />
        ))}
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-center text-[12px] text-[#b06a5a]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !complete}
        className="mt-5 w-full cursor-pointer rounded-full border-none bg-[linear-gradient(135deg,#c08d79,#b07e6a)] p-[15px] text-[13px] font-medium tracking-[.2em] text-white uppercase shadow-[0_12px_24px_-12px_rgba(176,126,106,.9)] disabled:cursor-default disabled:opacity-45 disabled:shadow-none"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
