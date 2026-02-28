export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Solo permitir POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return new Response('No image provided', { status: 400 });
    }

    // Llamar a Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/briaai/REMBG-1.4',
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        method: 'POST',
        body: file,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', errorText);
      
      if (response.status === 503) {
        return new Response('Model is loading, please retry in 20 seconds', { status: 503 });
      }
      
      return new Response('Processing failed', { status: response.status });
    }

    // Retornar la imagen procesada
    const imageBlob = await response.blob();
    
    return new Response(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('API Route Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}