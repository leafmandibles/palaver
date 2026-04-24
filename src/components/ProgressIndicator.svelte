<script>
  let { status = "Thinking..." } = $props();
</script>

<div class="progress-indicator">
  <div class="spinner">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#9ca3af" class="star" />
      <path d="M19.5 5.5L20.5 7.5L22.5 8.5L20.5 9.5L19.5 11.5L18.5 9.5L16.5 8.5L18.5 7.5L19.5 5.5Z" fill="#d1d5db" class="sparkle" />
    </svg>
  </div>
  <span class="text">{status}</span>
</div>

<style>
  .progress-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    color: #6b7280; /* Tailwind gray-500 */
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.95rem;
    margin-top: 1rem;
    animation: fadeIn 0.3s ease-in;
  }

  .spinner {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .star {
    animation: spin-pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .sparkle {
    animation: spin-pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1) 1s;
    transform-origin: center;
  }

  @keyframes spin-pulse {
    0% {
      transform: scale(0.8) rotate(0deg);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.1) rotate(90deg);
      opacity: 1;
    }
    100% {
      transform: scale(0.8) rotate(180deg);
      opacity: 0.5;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .text {
    font-weight: 500;
  }
</style>