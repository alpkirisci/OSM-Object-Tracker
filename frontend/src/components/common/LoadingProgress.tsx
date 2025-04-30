// components/ui/LoadingProgress.tsx
import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import styles from './LoadingProgress.module.css';

interface LoadingProgressProps {
  status: string;
  progress: number;
  message: string;
  isVisible: boolean;
  mode?: 'create' | 'update';
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  status,
  progress,
  message,
  isVisible,
  mode = 'create' // Default to create mode if not specified
}) => {
  if (!isVisible) return null;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return (
          <div className={`${styles['status-icon']} ${styles['status-icon-success']}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`${styles['status-svg']} ${styles['status-svg-success']}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
      case 'error':
      case 'timeout':
        return (
          <div className={`${styles['status-icon']} ${styles['status-icon-error']}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`${styles['status-svg']} ${styles['status-svg-error']}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return <LoadingSpinner size="lg" className="text-primary" />;
    }
  };
  
  const getProgressSteps = () => {
    // Define different steps based on mode
    const steps = mode === 'create' 
      ? [
          { name: 'Content Generation', value: 'generating_content', percent: 25 },
          { name: 'Audio Synthesis', value: 'generating_audio', percent: 50 },
          { name: 'Video Creation', value: 'generating_video', percent: 75 },
          { name: 'Finalizing', value: 'completed', percent: 100 }
        ]
      : [
          { name: 'Updating Fields', value: 'updating_fields', percent: 20 },
          { name: 'Audio Processing', value: 'audio_processing', percent: 50 },
          { name: 'Video Creation', value: 'generating_video', percent: 80 },
          { name: 'Finalizing', value: 'completed', percent: 100 }
        ];

    // Define mapping between backend statuses and UI progress steps
    const mapStatusToStep = (currentStatus: string): string => {
      if (mode === 'create') {
        // For create endpoint
        if (currentStatus === 'generating_content') return 'generating_content';
        if (currentStatus === 'generating_audio') return 'generating_audio';
        if (currentStatus === 'generating_video') return 'generating_video';
        if (currentStatus === 'completed') return 'completed';
      } else {
        // For update endpoint
        if (currentStatus === 'updating_fields') return 'updating_fields';
        if (currentStatus === 'checking_audio' || currentStatus === 'generating_audio' || 
            currentStatus === 'audio_ready' || currentStatus === 'audio_unchanged') return 'audio_processing';
        if (currentStatus === 'preparing_video' || currentStatus === 'generating_video' || 
            currentStatus === 'video_ready') return 'generating_video';
        if (currentStatus === 'completed') return 'completed';
      }
      
      // Default mapping based on progress percentage
      const step = steps.find(s => progress <= s.percent);
      return step ? step.value : 'completed';
    };
    
    // Map the current status to a step
    const currentStep = mapStatusToStep(status);
    
    return (
      <div className="mt-6">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="badge badge-primary">
                Progress
              </span>
            </div>
            <div className="text-right">
              <span className={styles['progress-percentage']}>
                {progress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-light dark:bg-primary-dark/30">
            <div 
              style={{ width: `${progress}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-in-out"
            />
          </div>
        </div>
        
        <ol className={styles['progress-timeline']}>
          {steps.map((step, index) => {
            // Check if this step is the current step or a past step
            const stepValue = step.value;
            const stepIndex = steps.findIndex(s => s.value === stepValue);
            const currentStepIndex = steps.findIndex(s => s.value === currentStep);
            
            const isActive = stepIndex <= currentStepIndex || progress >= step.percent;
            const isCompleted = stepIndex < currentStepIndex || status === 'completed';
            
            const stepIndicatorClasses = [
              "absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white dark:ring-gray-800",
              isCompleted ? "bg-success dark:bg-success" : isActive ? "bg-primary dark:bg-primary" : "bg-gray-200 dark:bg-gray-600" 
            ].join(" ");
            
            return (
              <li key={step.value} className="mb-6 ml-6">
                <span className={stepIndicatorClasses}>
                  {isCompleted ? (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs text-white font-semibold">{index + 1}</span>
                  )}
                </span>
                <h3 className={`${styles['step-title']} ${isActive ? styles['step-title-active'] : styles['step-title-inactive']}`}>
                  {step.name}
                </h3>
              </li>
            );
          })}
        </ol>
      </div>
    );
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-4">
            <h3 className="heading-md">
              {status === 'completed' ? 'Process Complete' : 
               status === 'failed' || status === 'error' || status === 'timeout' ? 'Process Failed' : 
               'Processing...'}
            </h3>
            <p className="text-body">{message}</p>
          </div>
        </div>
        
        {status !== 'completed' && status !== 'failed' && status !== 'error' && status !== 'timeout' && getProgressSteps()}
        
        {(status === 'completed' || status === 'failed' || status === 'error' || status === 'timeout') && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {status === 'completed' ? 'Continue' : 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingProgress;