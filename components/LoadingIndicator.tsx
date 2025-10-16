/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Aquecendo o diretor digital...",
  "Reunindo pixels e fótons...",
  "Criando o storyboard da sua visão...",
  "Consultando a musa da IA...",
  "Renderizando a primeira cena...",
  "Aplicando iluminação cinematográfica...",
  "Isso pode levar alguns minutos, aguarde!",
  "Adicionando um toque de magia do cinema...",
  "Compondo o corte final...",
  "Polindo a obra-prima...",
  "Ensinando a IA a dizer 'Eu voltarei'...",
  "Verificando se há poeira digital...",
  "Calibrando os sensores de ironia...",
  "Desembaraçando as linhas do tempo...",
  "Aumentando para a velocidade da luz...",
  "Não se preocupe, os pixels são amigáveis.",
  "Colhendo caules de nano banana...",
  "Orando para a estrela Gemini...",
  "Começando um rascunho para o seu discurso do Oscar..."
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="w-16 h-16 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
      <h2 className="text-2xl font-semibold mt-8 text-gray-200">Gerando Seu Vídeo</h2>
      <p className="mt-2 text-gray-400 text-center transition-opacity duration-500">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;