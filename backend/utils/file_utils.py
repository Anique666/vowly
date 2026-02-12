import json
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)

# In-memory mutex for file access
file_locks: Dict[str, Lock] = {}

DATA_DIR = Path(__file__).parent / "data"

def get_file_lock(filename: str) -> Lock:
    """Get or create a lock for a specific file"""
    if filename not in file_locks:
        file_locks[filename] = Lock()
    return file_locks[filename]

def read_json_file(filename: str) -> Dict[str, Any]:
    """
    Safely read JSON from disk with file locking.
    Creates file with empty structure if missing.
    
    Args:
        filename: Name of the JSON file (e.g., 'wedding.json')
    
    Returns:
        Dictionary containing the JSON data
    """
    filepath = DATA_DIR / filename
    lock = get_file_lock(filename)
    
    with lock:
        try:
            # Create directory if it doesn't exist
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            
            # Create file with empty structure if missing
            if not filepath.exists():
                key = filename.replace('.json', '')
                initial_data = {key: []}
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(initial_data, f, indent=2)
                logger.info(f"Created new file: {filename}")
                return initial_data
            
            # Read existing file
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                logger.debug(f"Read {filename}: {len(str(data))} bytes")
                return data
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {filename}: {e}")
            raise ValueError(f"Invalid JSON in {filename}: {str(e)}")
        except Exception as e:
            logger.error(f"Error reading {filename}: {e}")
            raise

def write_json_file(filename: str, data: Dict[str, Any]) -> bool:
    """
    Safely write JSON to disk with file locking.
    Creates file if missing.
    
    Args:
        filename: Name of the JSON file (e.g., 'wedding.json')
        data: Dictionary to write as JSON
    
    Returns:
        True if successful
    """
    filepath = DATA_DIR / filename
    lock = get_file_lock(filename)
    
    with lock:
        try:
            # Create directory if it doesn't exist
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            
            # Write to temp file first, then rename (atomic operation)
            temp_filepath = filepath.with_suffix('.tmp')
            with open(temp_filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Rename temp file to actual file (atomic on Unix)
            temp_filepath.replace(filepath)
            
            logger.info(f"Wrote {filename}: {len(str(data))} bytes")
            return True
            
        except Exception as e:
            logger.error(f"Error writing {filename}: {e}")
            raise

def append_to_collection(filename: str, collection_key: str, item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Append an item to a collection in a JSON file.
    
    Args:
        filename: Name of the JSON file
        collection_key: Key of the array to append to (e.g., 'weddings', 'guests')
        item: Item to append
    
    Returns:
        The appended item
    """
    data = read_json_file(filename)
    
    if collection_key not in data:
        data[collection_key] = []
    
    data[collection_key].append(item)
    write_json_file(filename, data)
    
    return item

def update_in_collection(
    filename: str,
    collection_key: str,
    item_id: str,
    updated_item: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update an item in a collection by ID.
    
    Args:
        filename: Name of the JSON file
        collection_key: Key of the array
        item_id: ID of the item to update
        updated_item: Updated item data
    
    Returns:
        The updated item
    
    Raises:
        ValueError: If item not found
    """
    data = read_json_file(filename)
    
    if collection_key not in data:
        raise ValueError(f"Collection '{collection_key}' not found")
    
    collection = data[collection_key]
    for i, item in enumerate(collection):
        if item.get('id') == item_id:
            collection[i] = updated_item
            write_json_file(filename, data)
            return updated_item
    
    raise ValueError(f"Item with id '{item_id}' not found")

def delete_from_collection(filename: str, collection_key: str, item_id: str) -> bool:
    """
    Delete an item from a collection by ID.
    
    Args:
        filename: Name of the JSON file
        collection_key: Key of the array
        item_id: ID of the item to delete
    
    Returns:
        True if deleted
    
    Raises:
        ValueError: If item not found
    """
    data = read_json_file(filename)
    
    if collection_key not in data:
        raise ValueError(f"Collection '{collection_key}' not found")
    
    collection = data[collection_key]
    original_length = len(collection)
    
    data[collection_key] = [item for item in collection if item.get('id') != item_id]
    
    if len(data[collection_key]) == original_length:
        raise ValueError(f"Item with id '{item_id}' not found")
    
    write_json_file(filename, data)
    return True

def get_from_collection(filename: str, collection_key: str, item_id: str) -> Dict[str, Any]:
    """
    Get a single item from a collection by ID.
    
    Args:
        filename: Name of the JSON file
        collection_key: Key of the array
        item_id: ID of the item to get
    
    Returns:
        The item
    
    Raises:
        ValueError: If item not found
    """
    data = read_json_file(filename)
    
    if collection_key not in data:
        raise ValueError(f"Collection '{collection_key}' not found")
    
    for item in data[collection_key]:
        if item.get('id') == item_id:
            return item
    
    raise ValueError(f"Item with id '{item_id}' not found")

def list_collection(filename: str, collection_key: str, filter_by: Dict[str, Any] = None) -> list:
    """
    List all items in a collection, optionally filtered.
    
    Args:
        filename: Name of the JSON file
        collection_key: Key of the array
        filter_by: Optional dictionary of key-value pairs to filter by
    
    Returns:
        List of items
    """
    data = read_json_file(filename)
    
    if collection_key not in data:
        return []
    
    items = data[collection_key]
    
    if filter_by:
        filtered_items = []
        for item in items:
            match = all(item.get(key) == value for key, value in filter_by.items())
            if match:
                filtered_items.append(item)
        return filtered_items
    
    return items
