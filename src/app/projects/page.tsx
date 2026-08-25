'use client';
import React, { useState } from 'react';
import Layout from '../components/template';
import Header from '../components/Header';
import Projects from '../projects';
import ProjectTeaser from '../components/ProjectTeaser';



function LP() {

  return (
    <Layout>
      <div className='space-y-10 flex flex-col'>
              {Projects.map(project => {
        return <ProjectTeaser project={project} key={project.workName} ></ProjectTeaser>
      })}
      </div>
    </Layout>
  );
}

export default LP;
