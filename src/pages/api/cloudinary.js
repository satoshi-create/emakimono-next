import cloudinary from "@/libs/api/cloudinary";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { resources } = await cloudinary.search
        .expression() // 取得したいフォルダ名を指定
        .sort_by("public_id", "desc")
        .max_results(500)
        .execute();

      const images = resources.map((resource) => ({
        id: resource.public_id,
        url: resource.secure_url,
        created_at: resource.created_at,
        width: resource.width,
        height: resource.height,
      }));

      res.status(200).json({ images });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images from Cloudinary" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
