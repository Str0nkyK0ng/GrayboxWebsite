'use client';
import React, { useState } from 'react';
import Layout from './components/template';
import Header from './components/Header';
import Projects from './projects';
import ProjectSpotlight from './components/ProjectSpotlight';



function LP() {

  return (
    <Layout>
        <ProjectSpotlight project={Projects[Projects.length-1]}></ProjectSpotlight>
    </Layout>
  );
}

export default LP;
