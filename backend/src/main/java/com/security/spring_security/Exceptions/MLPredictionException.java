package com.security.spring_security.Exceptions;

public class MLPredictionException extends Exception {
    private final ErrorType errorType;
    
    public enum ErrorType {
        VALIDATION_ERROR("Input validation failed"),
        ML_SERVICE_UNAVAILABLE("ML service is not responding"),
        ML_SERVICE_ERROR("ML service returned an error"),
        NETWORK_ERROR("Network connectivity issue"),
        TIMEOUT_ERROR("Request timed out"),
        UNKNOWN_ERROR("Unknown error occurred");
        
        private final String description;
        
        ErrorType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    public MLPredictionException(ErrorType errorType, String message) {
        super(message);
        this.errorType = errorType;
    }
    
    public MLPredictionException(ErrorType errorType, String message, Throwable cause) {
        super(message, cause);
        this.errorType = errorType;
    }
    
    public ErrorType getErrorType() {
        return errorType;
    }
    
    public String getErrorMessage() {
        return errorType.getDescription() + ": " + getMessage();
    }
}
