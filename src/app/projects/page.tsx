'use client';
import React, { useState } from 'react';
import Layout from '../components/template';
import Header from '../components/Header';
import Projects from '../projects';
import ProjectDisplay from '../components/ProjectDisplay';



function LP() {

  return (
    <Layout>
      <Header></Header>
      {Projects.map(project => {
        return <ProjectDisplay project={project} key={project.workName} ></ProjectDisplay>
      })}
    </Layout>
  );
}

export default LP;
