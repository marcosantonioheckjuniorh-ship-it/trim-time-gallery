import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminLogin } from "@/components/AdminLogin";

const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Owner login", () => {
  it("signs in using the entered email and password", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    render(<AdminLogin />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "example-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "owner@example.com", password: "example-password" }));
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("sends password recovery to the dedicated recovery page", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole("button", { name: "Esqueci ou ainda não tenho senha" }));
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link para definir senha" }));
    await waitFor(() => expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("owner@example.com", { redirectTo: `${window.location.origin}/reset-password` }));
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});