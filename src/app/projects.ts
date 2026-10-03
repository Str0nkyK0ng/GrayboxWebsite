// Project content lives in content/projects/*.md (frontmatter for the
// structured fields, a couple of "## ... Description" sections for the
// prose). scripts/generate-projects.ts reads those files and produces
// ./projects.generated.ts, which this module just shapes into `Project[]`.
//
// Editing a project? Edit its .md file in content/projects/, not this file.
import { rawProjects } from './projects.generated';

export interface Project {
  artistName: string;
  artistLink: string;
  artistDescriptionHtml: string; // rendered from markdown at generate time
  workName: string;
  workDescriptionHtml: string; // rendered from markdown at generate time
  workDescriptionText: string; // markdown stripped, for <meta> etc.
  img: string;
  venue: string;
  address: string;
  locationGoogleMapsLink: string;
  launchDate: Date;
  endDate: Date;
  slug: string;
  coordinates: {
    long: number;
    lat: number;
  };
}

// Projects without an `endDate` in their frontmatter default to a
// three-month run.
function resolveEndDate(launchDate: Date, endDate: string): Date {
  if (endDate) return new Date(endDate);
  const fallback = new Date(launchDate);
  fallback.setMonth(fallback.getMonth() + 3);
  return fallback;
}

export let Projects: Project[] = rawProjects.map((p) => {
  const launchDate = new Date(p.launchDate);
  return {
    ...p,
    launchDate,
    endDate: resolveEndDate(launchDate, p.endDate),
  };
});

export default Projects;
