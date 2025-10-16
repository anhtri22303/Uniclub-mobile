#!/bin/bash

# Script to setup UniClub logo
# Run this script after placing the UniClub logo in the project

echo "Setting up UniClub logo..."

# Check if uniclub-logo.png exists
if [ -f "assets/images/uniclub-logo.png" ]; then
    echo "✅ Found uniclub-logo.png"
    
    # Copy to required locations
    cp assets/images/uniclub-logo.png assets/images/icon.png
    cp assets/images/uniclub-logo.png assets/images/adaptive-icon.png
    cp assets/images/uniclub-logo.png assets/images/favicon.png
    cp assets/images/uniclub-logo.png assets/images/splash-icon.png
    
    echo "✅ Logo copied to all required locations"
    echo "🚀 Ready to build with UniClub branding!"
else
    echo "❌ Please place your UniClub logo as 'assets/images/uniclub-logo.png'"
    echo "📝 Logo should be:"
    echo "   - Square format (recommended: 512x512px)"
    echo "   - PNG format"
    echo "   - Transparent background preferred"
fi