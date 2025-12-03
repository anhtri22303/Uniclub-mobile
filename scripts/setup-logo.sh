#!/bin/bash

# Script to setup UniClub logo
# Run this script after placing the UniClub logo in the project

echo "Setting up UniClub logo..."

# Check if logo1.jpg exists
if [ -f "assets/images/logo1.jpg" ]; then
    echo "✅ Found logo1.jpg"
    
    # Copy to required locations
    cp assets/images/logo1.jpg assets/images/icon.png
    cp assets/images/logo1.jpg assets/images/adaptive-icon.png
    cp assets/images/logo1.jpg assets/images/favicon.png
    cp assets/images/logo1.jpg assets/images/splash-icon.png
    
    echo "✅ Logo copied to all required locations"
    echo "🚀 Ready to build with UniClub branding!"
else
    echo "❌ Please place your UniClub logo as 'assets/images/logo1.jpg'"
    echo "📝 Logo should be:"
    echo "   - Square format (recommended: 512x512px)"
    echo "   - JPG format"
    echo "   - Transparent background preferred"
fi