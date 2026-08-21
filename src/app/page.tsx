'use client';
import React from 'react';
import Layout from './components/template';
import NotesLayout from './components/NotesLayout';
import PixelCube from './components/PixelCube'


function LP() {
  return (
    <NotesLayout>
      <h1>GRAYBOX ARCADE</h1>
      <PixelCube color="#ff7a18" pixelSize={8} speed={1} height={360} className="" style={{}} />
    </NotesLayout>
  );
}

export default LP;
