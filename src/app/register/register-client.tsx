"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getFirebaseAuth } from "@/lib/firebase-client";

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(
    null
  );
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaId = "firebase-recaptcha";

  const normalizedPhone = useMemo(() => {
    if (!phoneDigits) return "";
    return `+7${phoneDigits}`;
  }, [phoneDigits]);

  const isPhoneValid = phoneDigits.length === 10;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (recaptchaRef.current) return;
    const auth = getFirebaseAuth();
    auth.languageCode = "ru";
    recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaId, {
      size: "invisible",
    });
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  async function sendCode() {
    setError(null);
    if (!normalizedPhone) {
      setError("Укажи телефон в формате +7...");
      return;
    }
    const verifier = recaptchaRef.current;
    if (!verifier) {
      setError("reCAPTCHA не готова, попробуй позже");
      return;
    }
    setSendingCode(true);
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
      setConfirmResult(result);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось отправить код");
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCode() {
    setError(null);
    if (!confirmResult) {
      setError("Сначала отправь код");
      return;
    }
    if (!smsCode.trim()) {
      setError("Введи код из SMS");
      return;
    }
    setVerifyingCode(true);
    try {
      const credential = await confirmResult.confirm(smsCode.trim());
      const token = await credential.user.getIdToken(true);
      setFirebaseIdToken(token);
      setPhoneVerified(true);
    } catch (e: any) {
      setError(e?.message ?? "Неверный код");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function submit() {
    setError(null);
    if (!isPhoneValid) return setError("Укажи корректный номер телефона");
    if (!phoneVerified) return setError("Подтверди телефон кодом");
    if (!password || password.length < 6)
      return setError("Пароль минимум 6 символов");

    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          email: email || null,
          phone: normalizedPhone || null,
          password,
          firebaseIdToken,
        }),
      });
      const text = await r.text();
      if (!r.ok) {
        setError(`${r.status}: ${text.slice(0, 200)}`);
        return;
      }
      router.push("/my");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4 space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <div className="mb-1 text-sm font-medium">Имя</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Email</div>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Телефон</div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            +7
          </div>
          <Input
            value={phoneDigits}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhoneDigits(next);
              setPhoneVerified(false);
              setFirebaseIdToken(null);
              setConfirmResult(null);
            }}
            placeholder="9000000000"
            inputMode="numeric"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={sendCode}
            disabled={sendingCode || !isPhoneValid}
          >
            {sendingCode ? "Отправляем..." : "Отправить код"}
          </Button>
          <Input
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            placeholder="Код из SMS"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={verifyCode}
            disabled={verifyingCode || !confirmResult}
          >
            {verifyingCode ? "Проверяем..." : "Подтвердить"}
          </Button>
          {phoneVerified && (
            <div className="text-xs text-emerald-600">Телефон подтвержден</div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Номер: +7 и 10 цифр.
        </div>
        <div id={recaptchaId} />
      </div>
      <div>
        <div className="mb-1 text-sm font-medium">Пароль</div>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button onClick={submit} disabled={loading}>
        {loading ? "Создаём..." : "Зарегистрироваться"}
      </Button>
    </Card>
  );
}
