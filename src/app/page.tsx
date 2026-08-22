'use client';
import React, { useState } from 'react';
import Layout from './components/template';
import Header from './components/Header';
import Projects from './projects';
import ProjectDisplay from './components/ProjectDisplay';



function LP() {

  return (
    <Layout>
      <Header></Header>
        <ProjectDisplay project={Projects[Projects.length-1]}></ProjectDisplay>
    </Layout>
  );
}

export default LP;
