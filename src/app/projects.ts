// Project content lives in content/projects/*.md (frontmatter for the
// structured fields, a couple of "## ... Description" sections for the
// prose). scripts/generate-projects.ts reads those files and produces
// ./projects.generated.ts, which this module just shapes into `Project[]`.
//
// Editing a project? Edit its .md file in content/projects/, not this file.
import { rawProjects } from "./projects.generated";

export interface Project {
  artistName: string;
  artistLink: string;
  artistDescription: string;
  workName: string;
  workDescription: string;
  img: string;
  venue: string;
  address: string;
  locationGoogleMapsLink: string;
  launchDate: Date;
  slug: string;
  coordinates: {
    long: number;
    lat: number;
  };
}

export let Projects: Project[] = rawProjects.map((p) => ({
  ...p,
  launchDate: new Date(p.launchDate),
}));

export default Projects;
