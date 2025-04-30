import Link from "next/link";
import ProductCard from "./components/product-card/product-card";

export default function Home() {
  return (
    <main>
      <h1>Hello World!</h1>
      <Link href="/users">Users</Link>
      <Link href="/users/new">New User</Link>
      <ProductCard />
    </main>
  );
}
