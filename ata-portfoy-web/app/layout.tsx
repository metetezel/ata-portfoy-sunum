import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";
import { lisansKontrol } from "@/lib/lisansKontrol";

// The Ata Portföy logo's wordmark is a geometric rounded sans — Poppins is the
// closest widely-available match, used holistically across the whole page
// (headings, body, data) instead of mixing typefaces.
const poppins = Poppins({
  subsets: ["latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Ata Portföy Sunum",
  description: "Haftalık yatırımcı sunumu",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Her istekte GitHub'daki açma/kapama dosyasını kontrol et (bkz.
  // lib/lisansKontrol.ts). connection() sayfanın build sırasında bir kez
  // statik üretilip kontrolün atlanmasını engelliyor.
  await connection();
  const lisans = await lisansKontrol();
  if (!lisans.izinli) {
    console.warn(`[lisans] ${lisans.sebep}`);
  } else if (lisans.uyari) {
    console.warn(`[lisans] ${lisans.uyari}`);
  }

  return (
    <html lang="tr" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {lisans.izinli ? (
          children
        ) : (
          <main className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <h1 className="text-2xl font-semibold">Sunum kilitli</h1>
              <p className="mt-3">{lisans.sebep}</p>
              <p className="mt-1">Bu kopyanın kullanımı kapatılmış olabilir. Mete Tezel ile iletişime geçin.</p>
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
