"""Format Google API errors for terminal output."""

from __future__ import annotations

import re


def format_google_api_error(exc: Exception, *, service: str) -> str:
    message = str(exc)

    if "accessNotConfigured" in message or "has not been used in project" in message:
        match = re.search(r"project (\d+)", message)
        project = match.group(1) if match else "YOUR_GCP_PROJECT"
        if service == "gsc":
            api = "searchconsole.googleapis.com"
            label = "Google Search Console API"
        else:
            api = "analyticsdata.googleapis.com"
            label = "Google Analytics Data API"
        return (
            f"{label} is not enabled for GCP project {project}.\n"
            f"  Enable: https://console.cloud.google.com/apis/library/{api}?project={project}\n"
            f"  Wait 1-2 minutes after enabling, then retry.\n"
            f"  GA4 only (skip GSC): py -3.14 scripts/analytics/fetch_all.py --skip-gsc"
        )

    if "403" in message and service == "gsc" and (
        "sufficient permission" in message.lower() or "forbidden" in message.lower()
    ):
        return (
            "GSC permission denied.\n"
            "  Add the service account email to Search Console users "
            "(Settings > Users and permissions).\n"
            f"  Original: {message}"
        )

    if "403" in message and service == "ga4":
        return (
            f"GA4 permission denied. Grant the service account Viewer on the GA4 property.\n"
            f"  Original: {message}"
        )

    if service == "gsc" and ("400" in message or "invalid argument" in message.lower()):
        return (
            "GSC request rejected (invalid site URL or date range).\n"
            "  Set GitHub Secret GSC_SITE_URL to the exact property URL from Search Console.\n"
            "  Domain properties: sc-domain:emakimono.com (no https://, no trailing slash).\n"
            "  Run locally: py -3.14 scripts/analytics/check_analytics_config.py\n"
            f"  Original: {message}"
        )

    return message
