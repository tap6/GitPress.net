import { getTranslations } from "next-intl/server";
import { DisconnectSiteForm } from "@/components/DisconnectSiteForm";
import type { RepoPresence } from "@/lib/github";

interface Props {
  siteId: string;
  siteName: string;
  slug: string;
  dataRepo: string;
  siteRepo: string;
  dataStatus: RepoPresence;
  siteStatus: RepoPresence;
  installUrl: string;
}

export async function RepoMissingBanner({
  siteId,
  siteName,
  slug,
  dataRepo,
  siteRepo,
  dataStatus,
  siteStatus,
  installUrl,
}: Props) {
  const t = await getTranslations("disconnect");
  const statusLabel = (value: RepoPresence) => t(`status.${value}`);

  return (
    <div className="mb-6 max-w-3xl rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-semibold">{t("missingTitle")}</p>
      <p className="mt-2 leading-relaxed">{t("leadMissing")}</p>
      <ul className="mt-3 space-y-1 font-mono text-xs">
        <li>
          {t("dataRepo")}{" "}
          <a href={`https://github.com/${dataRepo}`} className="underline" target="_blank" rel="noreferrer">
            {dataRepo}
          </a>{" "}
          · <span className="font-sans">{statusLabel(dataStatus)}</span>
        </li>
        <li>
          {t("siteRepo")}{" "}
          <a href={`https://github.com/${siteRepo}`} className="underline" target="_blank" rel="noreferrer">
            {siteRepo}
          </a>{" "}
          · <span className="font-sans">{statusLabel(siteStatus)}</span>
        </li>
      </ul>
      <p className="mt-3 leading-relaxed">{t("notDeleteGithub")}</p>
      <p className="mt-2">
        <a href={installUrl} className="font-medium underline" target="_blank" rel="noreferrer">
          {t("installSettings")}
        </a>
      </p>
      <div className="mt-4 border-t border-amber-200 pt-4">
        <DisconnectSiteForm siteId={siteId} siteName={siteName} slug={slug} />
      </div>
    </div>
  );
}
