import LoginForm from "@/components/admin/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <h1>Panel de administración</h1>
        <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />
      </div>
    </main>
  );
}
