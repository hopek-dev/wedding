import { listSitePhotosAdmin } from "@/app/actions/photos";
import { PhotosManager } from "@/components/photos/photos-manager";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const res = await listSitePhotosAdmin();
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Site photos</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Every picture on the wedding website, in one place. Replace a photo, click on the faces so the site keeps them in view when it crops, or put the original back. Changes show on the website within a couple of minutes. The photo you upload is kept at its own shape, up to 2600 px, so send the largest original you have.
        </p>
      </div>
      {res.ok ? (
        <PhotosManager rows={res.rows} />
      ) : (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium">{res.error}</p>
          <p className="mt-1 text-muted-foreground">Until then the website uses its original photos.</p>
        </div>
      )}
    </div>
  );
}
