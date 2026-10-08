import { Fraunces, Instrument_Sans } from "next/font/google";

export const fraunces = Fraunces({ variable: "--font-fraunces", weight: "600", subsets: ["latin"] });
export const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});
