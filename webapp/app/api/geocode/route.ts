import axios from "axios";
import { NextResponse } from "next/server";

const OPENCAGE_KEY = process.env.OPENCAGE_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("q");

  if (!name) return NextResponse.json({ error: "Missing q param" }, { status: 400 });

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      name
    )}&key=${OPENCAGE_KEY}`;

    const { data } = await axios.get(url);

    if (data.results.length === 0)
      return NextResponse.json({ coords: null });

    const { lat, lng } = data.results[0].geometry;
    return NextResponse.json({ latitude: lat, longitude: lng });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}