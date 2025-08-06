#!/usr/bin/env python3
"""
Data Processor for Israeli Urban Planning Repository
Processes existing plan data and converts to new structured format
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PlanningDataProcessor:
    def __init__(self, source_path, target_path):
        self.source_path = Path(source_path)
        self.target_path = Path(target_path)
        self.processed_count = 0
        self.error_count = 0
        
    def process_all_cities(self):
        """Process all cities from source to target structure"""
        logger.info(f"Starting data processing from {self.source_path} to {self.target_path}")
        
        # Find all city directories
        city_dirs = [d for d in self.source_path.iterdir() 
                    if d.is_dir() and not d.name.startswith('.')]
        
        for city_dir in city_dirs:
            try:
                self.process_city(city_dir)
            except Exception as e:
                logger.error(f"Error processing city {city_dir.name}: {e}")
                self.error_count += 1
        
        logger.info(f"Processing complete. Processed: {self.processed_count}, Errors: {self.error_count}")
    
    def process_city(self, city_dir):
        """Process a single city directory"""
        city_name = self.extract_city_name(city_dir.name)
        city_code = self.extract_city_code(city_dir.name)
        
        logger.info(f"Processing city: {city_name} (code: {city_code})")
        
        # Create city structure in target
        target_city_dir = self.target_path / "cities" / self.normalize_city_name(city_name)
        target_city_dir.mkdir(parents=True, exist_ok=True)
        
        # Process plans in city
        plans_processed = 0
        
        # Look for plan directories and JSON files
        for item in city_dir.iterdir():
            if item.is_dir() and self.is_plan_directory(item):
                try:
                    self.process_plan(item, target_city_dir)
                    plans_processed += 1
                except Exception as e:
                    logger.error(f"Error processing plan {item.name}: {e}")
                    self.error_count += 1
        
        # Create city metadata
        self.create_city_metadata(target_city_dir, city_name, city_code, plans_processed)
        self.processed_count += plans_processed
        
        logger.info(f"Completed city {city_name}: {plans_processed} plans processed")
    
    def process_plan(self, plan_dir, target_city_dir):
        """Process a single plan directory"""
        plan_number = plan_dir.name
        
        # Create plan structure
        target_plan_dir = target_city_dir / "plans" / plan_number
        target_plan_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        (target_plan_dir / "documents").mkdir(exist_ok=True)
        (target_plan_dir / "extracted").mkdir(exist_ok=True)
        (target_plan_dir / "analysis").mkdir(exist_ok=True)
        
        # Process plan details JSON
        plan_details_file = plan_dir / "plan_details.json"
        if plan_details_file.exists():
            plan_data = self.load_plan_details(plan_details_file)
            
            # Create structured metadata
            metadata = self.create_plan_metadata(plan_data)
            
            # Save metadata
            metadata_file = target_plan_dir / "plan_metadata.json"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            
            # Create README
            readme_content = self.create_plan_readme(plan_data, metadata)
            readme_file = target_plan_dir / "README.md"
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(readme_content)
        
        logger.debug(f"Processed plan: {plan_number}")
    
    def load_plan_details(self, file_path):
        """Load plan details from JSON file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def create_plan_metadata(self, plan_data):
        """Create structured metadata from plan data"""
        return {
            "basic_info": {
                "plan_number": plan_data.get("planNumber"),
                "plan_id": plan_data.get("planId"),
                "city": plan_data.get("cityText"),
                "status": plan_data.get("status"),
                "status_date": plan_data.get("statusDate", "").strip(),
                "plan_type": plan_data.get("mahut"),
                "relation_type": plan_data.get("relationType"),
                "processing_date": datetime.now().isoformat()
            },
            "documents_inventory": self.extract_documents_info(plan_data.get("documentsSet", {})),
            "search_keywords": self.generate_search_keywords(plan_data),
            "processing_metadata": {
                "source_system": "מערכת תוכניות תב״ע",
                "extraction_date": "2025-08-03",
                "processing_version": "1.0",
                "status": "processed"
            }
        }
    
    def extract_documents_info(self, documents_set):
        """Extract document information from documentsSet"""
        doc_info = {}
        
        # Takanon (Regulations)
        if "takanon" in documents_set and documents_set["takanon"]:
            doc_info["takanon"] = {
                "available": True,
                "path": documents_set["takanon"].get("path"),
                "description": documents_set["takanon"].get("info", "תקנון")
            }
        
        # Nispachim (Appendices)
        if "nispachim" in documents_set and documents_set["nispachim"]:
            doc_info["nispachim"] = []
            for nispach in documents_set["nispachim"]:
                doc_info["nispachim"].append({
                    "type": nispach.get("info"),
                    "path": nispach.get("path"),
                    "code": nispach.get("codeMismach")
                })
        
        # Tasritim (Drawings)
        if "tasritim" in documents_set and documents_set["tasritim"]:
            doc_info["tasritim"] = []
            for tasrit in documents_set["tasritim"]:
                doc_info["tasritim"].append({
                    "type": tasrit.get("info"),
                    "path": tasrit.get("path")
                })
        
        # MMG (Geographic data)
        if "mmg" in documents_set and documents_set["mmg"]:
            doc_info["mmg"] = {
                "available": True,
                "path": documents_set["mmg"].get("path"),
                "description": documents_set["mmg"].get("info")
            }
        
        # Government map
        if "map" in documents_set and documents_set["map"]:
            doc_info["government_map"] = {
                "url": documents_set["map"].get("path"),
                "description": documents_set["map"].get("info")
            }
        
        return doc_info
    
    def generate_search_keywords(self, plan_data):
        """Generate search keywords from plan data"""
        keywords = []
        
        # Basic info keywords
        if plan_data.get("planNumber"):
            keywords.append(plan_data["planNumber"])
        
        if plan_data.get("cityText"):
            keywords.append(plan_data["cityText"])
        
        if plan_data.get("mahut"):
            keywords.append(plan_data["mahut"])
        
        if plan_data.get("status"):
            keywords.append(plan_data["status"])
        
        # Document-based keywords
        docs = plan_data.get("documentsSet", {})
        if docs.get("nispachim"):
            for nispach in docs["nispachim"]:
                if nispach.get("info"):
                    keywords.append(nispach["info"])
        
        return keywords
    
    def create_plan_readme(self, plan_data, metadata):
        """Create README content for a plan"""
        plan_number = plan_data.get("planNumber", "לא ידוע")
        city = plan_data.get("cityText", "לא ידוע")
        mahut = plan_data.get("mahut", "לא ידוע")
        status = plan_data.get("status", "לא ידוע")
        
        content = f"""# 📋 תוכנית {plan_number} - {city}

## GitMCP Search Keywords
{plan_number}, {city}, {mahut}, {status}

## מידע בסיסי
- **מספר תוכנית:** {plan_number}
- **עיר:** {city}
- **מהות:** {mahut}
- **סטטוס:** {status}
- **תאריך סטטוס:** {plan_data.get('statusDate', '').strip()}

## מסמכים זמינים

"""
        
        # Add document information
        docs = metadata.get("documents_inventory", {})
        
        if docs.get("takanon"):
            content += "### 📜 תקנון\n"
            content += f"- {docs['takanon']['description']}\n\n"
        
        if docs.get("tasritim"):
            content += "### 🗺️ תשריטים\n"
            for tasrit in docs["tasritim"]:
                content += f"- {tasrit['type']}\n"
            content += "\n"
        
        if docs.get("nispachim"):
            content += "### 📎 נספחים\n"
            for nispach in docs["nispachim"]:
                content += f"- {nispach['type']}\n"
            content += "\n"
        
        content += """
## 🔍 מידע נוסף
למידע מפורט נוסף, עיין בקובץ `plan_metadata.json` בתיקייה זו.

---
*מעובד אוטומטית ממאגר תוכניות הבנייה הישראלי*
"""
        
        return content
    
    def create_city_metadata(self, city_dir, city_name, city_code, plans_count):
        """Create metadata file for the city"""
        metadata = {
            "city_info": {
                "name": city_name,
                "name_en": self.translate_city_name(city_name),
                "city_code": city_code,
                "total_plans": plans_count,
                "last_processed": datetime.now().isoformat()
            },
            "processing_info": {
                "source": "מערכת תוכניות תב״ע",
                "processor_version": "1.0",
                "extraction_date": "2025-08-03"
            }
        }
        
        metadata_file = city_dir / "city_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    def extract_city_name(self, dirname):
        """Extract clean city name from directory name"""
        # Remove date suffix and code
        parts = dirname.split('-')
        if len(parts) >= 2:
            return parts[0].replace('_', ' ')
        return dirname
    
    def extract_city_code(self, dirname):
        """Extract city code from directory name"""
        parts = dirname.split('-')
        if len(parts) >= 2:
            code_part = parts[1].split('_')[0]  # Remove date part
            try:
                return int(code_part)
            except ValueError:
                return 0
        return 0
    
    def normalize_city_name(self, city_name):
        """Normalize city name for directory structure"""
        return city_name.replace(' ', '-').lower()
    
    def translate_city_name(self, hebrew_name):
        """Basic translation of city names to English"""
        translations = {
            "אור יהודה": "Or Yehuda",
            "אבו גוש": "Abu Ghosh",
            "אבו סנאן": "Abu Snan",
            "אופקים": "Ofakim",
            "תל אביב": "Tel Aviv",
            "ירושלים": "Jerusalem",
            "חיפה": "Haifa"
        }
        return translations.get(hebrew_name, hebrew_name)
    
    def is_plan_directory(self, path):
        """Check if directory contains plan data"""
        return (path / "plan_details.json").exists()

def main():
    """Main processing function"""
    if len(sys.argv) < 3:
        print("Usage: python data_processor.py <source_path> <target_path>")
        sys.exit(1)
    
    source_path = sys.argv[1]
    target_path = sys.argv[2]
    
    processor = PlanningDataProcessor(source_path, target_path)
    processor.process_all_cities()

if __name__ == "__main__":
    main()