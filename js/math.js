// Enhanced Math Utilities - Simple and Efficient
// Provides comprehensive mathematical functions for the chatbot

export class MathUtilities {
    constructor() {
        // Constants
        this.PI = Math.PI;
        this.E = Math.E;
        this.GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

        // Common unit conversion factors
        this.conversionFactors = {
            // Length
            meters_to_feet: 3.28084,
            feet_to_meters: 1 / 3.28084,
            meters_to_inches: 39.3701,
            inches_to_meters: 1 / 39.3701,
            kilometers_to_miles: 0.621371,
            miles_to_kilometers: 1.60934,

            // Temperature
            celsius_to_fahrenheit: (c) => (c * 9/5) + 32,
            fahrenheit_to_celsius: (f) => (f - 32) * 5/9,
            celsius_to_kelvin: (c) => c + 273.15,
            kelvin_to_celsius: (k) => k - 273.15,
            fahrenheit_to_kelvin: (f) => (f - 32) * 5/9 + 273.15,
            kelvin_to_fahrenheit: (k) => (k - 273.15) * 9/5 + 32,

            // Weight/Mass
            kilograms_to_pounds: 2.20462,
            pounds_to_kilograms: 1 / 2.20462,
            grams_to_ounces: 0.035274,
            ounces_to_grams: 1 / 0.035274,

            // Volume
            liters_to_gallons: 0.264172,
            gallons_to_liters: 3.78541,
            milliliters_to_fluid_ounces: 0.033814,
            fluid_ounces_to_milliliters: 29.5735
        };
    }

    // Evaluate mathematical expressions safely
    evaluate(expression) {
        try {
            // Clean and validate the expression
            const cleanExpr = this._sanitizeExpression(expression);
            if (!cleanExpr) return null;

            // Replace constants
            let processedExpr = cleanExpr
                .replace(/\bpi\b/gi, this.PI.toString())
                .replace(/\be\b/gi, this.E.toString())
                .replace(/\bphi\b/gi, this.GOLDEN_RATIO.toString());

            // Evaluate the expression
            return this._safeEvaluate(processedExpr);
        } catch (error) {
            console.error('Math evaluation error:', error);
            return null;
        }
    }

    // Handle unit conversions
    convertUnits(value, fromUnit, toUnit) {
        try {
            const val = parseFloat(value);
            const key = `${fromUnit}_to_${toUnit}`;

            if (this.conversionFactors[key]) {
                const factor = this.conversionFactors[key];
                return typeof factor === 'function' ? factor(val) : val * factor;
            }

            return null;
        } catch (error) {
            console.error('Unit conversion error:', error);
            return null;
        }
    }

    // Scientific functions
    scientificFunctions = {
        sqrt: (x) => Math.sqrt(x),
        cbrt: (x) => Math.cbrt(x),
        sin: (x) => Math.sin(this._degreesToRadians ? x : x), // Assume radians
        cos: (x) => Math.cos(this._degreesToRadians ? x : x),
        tan: (x) => Math.tan(this._degreesToRadians ? x : x),
        asin: (x) => Math.asin(x),
        acos: (x) => Math.acos(x),
        atan: (x) => Math.atan(x),
        log: (x) => Math.log10(x), // log base 10
        ln: (x) => Math.log(x), // natural log
        exp: (x) => Math.exp(x),
        abs: (x) => Math.abs(x),
        ceil: (x) => Math.ceil(x),
        floor: (x) => Math.floor(x),
        round: (x) => Math.round(x),
        factorial: (n) => {
            if (n < 0 || !Number.isInteger(n)) return null;
            if (n > 170) return Infinity; // Prevent overflow
            let result = 1;
            for (let i = 2; i <= n; i++) result *= i;
            return result;
        },
        pow: (base, exponent) => Math.pow(base, exponent),
        min: (...args) => Math.min(...args),
        max: (...args) => Math.max(...args),
        sum: (...args) => args.reduce((a, b) => a + b, 0),
        average: (...args) => args.reduce((a, b) => a + b, 0) / args.length
    };

    // Calculate derivative (basic implementation)
    derivative(expression, variable = 'x', h = 0.0001) {
        try {
            // Simple numerical derivative for basic functions
            // For more complex derivatives, would need symbolic math library
            const f = (x) => {
                const expr = expression.replace(new RegExp(variable, 'g'), x);
                return this.evaluate(expr) || 0;
            };

            const x = 0; // Default point
            return (f(x + h) - f(x - h)) / (2 * h);
        } catch (error) {
            console.error('Derivative calculation error:', error);
            return null;
        }
    }

    // Calculate integral (basic numerical integration)
    integral(expression, variable = 'x', a = 0, b = 1, steps = 1000) {
        try {
            const f = (x) => {
                const expr = expression.replace(new RegExp(variable, 'g'), x);
                return this.evaluate(expr) || 0;
            };

            const h = (b - a) / steps;
            let sum = 0;

            // Simpson's rule for numerical integration
            for (let i = 0; i <= steps; i++) {
                const x = a + i * h;
                const weight = i === 0 || i === steps ? 1 : (i % 2 === 0 ? 2 : 4);
                sum += weight * f(x);
            }

            return (h / 3) * sum;
        } catch (error) {
            console.error('Integral calculation error:', error);
            return null;
        }
    }

    // Utility functions
    isValidNumber(value) {
        return !isNaN(value) && isFinite(value);
    }

    formatNumber(num, decimals = 2) {
        if (!this.isValidNumber(num)) return num;
        return parseFloat(num.toFixed(decimals));
    }

    // Private helper methods
    _sanitizeExpression(expr) {
        // Remove potentially dangerous characters and functions
        const sanitized = expr
            .replace(/[^0-9+\-*/().\s sqrtcbrtsincostanlnexplogabscbrtfactorialpowminmaxsumaverage,]/gi, '')
            .trim();

        // Check for valid mathematical expression pattern
        if (!/^[\d+\-*/().\s,sqrtcbrtsincostanlnexplogabscbrtfactorialpowminmaxsumaverage]+$/.test(sanitized)) {
            return null;
        }

        return sanitized;
    }

    _safeEvaluate(expr) {
        // Use Function constructor for safe evaluation (avoid eval)
        try {
            return Function(`"use strict"; return (${expr})`)();
        } catch (error) {
            // If Function fails, try with available math functions
            return this._evaluateWithFunctions(expr);
        }
    }

    _evaluateWithFunctions(expr) {
        // Replace function calls with Math equivalents
        let processed = expr;

        // Handle scientific functions
        Object.entries(this.scientificFunctions).forEach(([name, func]) => {
            const regex = new RegExp(`${name}\\s*\\(([^)]+)\\)`, 'gi');
            processed = processed.replace(regex, (match, args) => {
                try {
                    const argValues = args.split(',').map(arg => {
                        const val = this.evaluate(arg.trim());
                        return val !== null ? val : arg.trim();
                    });
                    return func(...argValues);
                } catch (e) {
                    return match;
                }
            });
        });

        // Final evaluation
        try {
            return Function(`"use strict"; return (${processed})`)();
        } catch (error) {
            return null;
        }
    }
}

// Create and export singleton instance
const mathUtils = new MathUtilities();

export { mathUtils };

// Legacy exports for backward compatibility
export function evaluateExpression(expr) {
    return mathUtils.evaluate(expr);
}

export function convertUnits(value, fromUnit, toUnit) {
    return mathUtils.convertUnits(value, fromUnit, toUnit);
}

export function derivative(expr, variable = 'x') {
    return mathUtils.derivative(expr, variable);
}

export function integral(expr, variable = 'x', a = 0, b = 1) {
    return mathUtils.integral(expr, variable, a, b);
}

// Default export
export default mathUtils;
