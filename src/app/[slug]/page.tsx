// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ProjectSpotlight from '../components/ProjectSpotlight';
import Layout from '../components/template';
import Header from '../components/Header';
import Projects from '../projects';


function getProjectBySlug(s:string){
  return Projects.find((project) => project.slug === s);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};
  return {
    title: project.workName,
    description: project.workDescription,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();
  return (
    <Layout>
        <ProjectSpotlight project={project}></ProjectSpotlight>
    </Layout>
  );
}
