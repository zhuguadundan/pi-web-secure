import { NextRequest, NextResponse } from "next/server";
import { stat } from "fs/promises";
import {
  getBrowseStartDirectory,
  getParentDirectory,
  listDirectories,
  listWindowsDrives,
  resolveDirectory,
  shouldShowWindowsDrivePicker,
} from "@/lib/directory-browser";

export const dynamic = "force-dynamic";

// GET /api/cwd/browse?path=... — list readable subdirectories of a filesystem
// path so the UI can offer a navigable directory picker. Read-only: nothing is
// registered as browsable here; that only happens when the picked directory is
// actually opened through POST /api/cwd/validate. Set
// PI_WEB_DISABLE_CWD_BROWSE=1 to disable enumeration entirely (the picker
// falls back to manual path entry).
export async function GET(request: NextRequest) {
  if (process.env.PI_WEB_DISABLE_CWD_BROWSE === "1") {
    return NextResponse.json({ error: "Directory browsing is disabled on this server (PI_WEB_DISABLE_CWD_BROWSE=1)" }, { status: 403 });
  }

  try {
    const requested = request.nextUrl.searchParams.get("path")?.trim();

    if (shouldShowWindowsDrivePicker(requested)) {
      return NextResponse.json({
        path: "",
        parentPath: null,
        drives: await listWindowsDrives(),
        directories: [],
      });
    }

    const candidate = getBrowseStartDirectory(requested);

    let resolved: string;
    try {
      resolved = await resolveDirectory(candidate);
    } catch {
      return NextResponse.json({ error: "Directory does not exist" }, { status: 404 });
    }

    const directoryStat = await stat(resolved);
    if (!directoryStat.isDirectory()) {
      return NextResponse.json({ error: "Path is not a directory" }, { status: 400 });
    }

    const directories = await listDirectories(resolved);

    return NextResponse.json({
      path: resolved,
      parentPath: getParentDirectory(resolved),
      directories,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
