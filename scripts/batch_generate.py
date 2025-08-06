#!/usr/bin/env python
"""Batch generation script for multiple shorts videos"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import concurrent.futures
from typing import List, Dict, Any

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from main import ShortsGenerator
from utils import setup_logger


def load_batch_config(config_file: str) -> List[Dict[str, Any]]:
    """Load batch configuration from JSON file"""
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_single_video(config: Dict[str, Any], index: int) -> Dict[str, Any]:
    """Generate a single video from configuration"""
    logger = setup_logger(f"batch_{index}")
    
    try:
        logger.info(f"Starting generation {index + 1}: {config.get('name', 'Unnamed')}")
        
        # Initialize generator
        generator = ShortsGenerator(config.get('config_file'))
        
        # Generate video
        generator.generate_from_folder(
            images_folder=config['images_folder'],
            script_file=config['script_file'],
            output_path=config['output_path'],
            template=config.get('template', 'basic'),
            background_music=config.get('background_music'),
            use_tts=config.get('use_tts', True)
        )
        
        logger.info(f"Completed generation {index + 1}")
        
        return {
            'index': index,
            'name': config.get('name', 'Unnamed'),
            'status': 'success',
            'output': config['output_path']
        }
        
    except Exception as e:
        logger.error(f"Failed generation {index + 1}: {str(e)}")
        
        return {
            'index': index,
            'name': config.get('name', 'Unnamed'),
            'status': 'failed',
            'error': str(e)
        }


def generate_batch(configs: List[Dict[str, Any]], 
                  parallel: bool = False,
                  max_workers: int = 3) -> List[Dict[str, Any]]:
    """Generate multiple videos in batch"""
    results = []
    
    if parallel:
        # Parallel generation
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(generate_single_video, config, i)
                for i, config in enumerate(configs)
            ]
            
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())
    else:
        # Sequential generation
        for i, config in enumerate(configs):
            result = generate_single_video(config, i)
            results.append(result)
    
    return results


def print_results(results: List[Dict[str, Any]]):
    """Print batch generation results"""
    print("\n" + "="*60)
    print("BATCH GENERATION RESULTS")
    print("="*60)
    
    success_count = sum(1 for r in results if r['status'] == 'success')
    failed_count = sum(1 for r in results if r['status'] == 'failed')
    
    print(f"\nTotal: {len(results)} | Success: {success_count} | Failed: {failed_count}")
    print("-"*60)
    
    for result in sorted(results, key=lambda x: x['index']):
        status_symbol = "✅" if result['status'] == 'success' else "❌"
        print(f"{status_symbol} [{result['index'] + 1}] {result['name']}")
        
        if result['status'] == 'success':
            print(f"   Output: {result['output']}")
        else:
            print(f"   Error: {result.get('error', 'Unknown error')}")
    
    print("="*60)


def main():
    """Main entry point for batch generation"""
    parser = argparse.ArgumentParser(description="Batch generate multiple shorts videos")
    
    parser.add_argument('config', help='Batch configuration JSON file')
    parser.add_argument('--parallel', action='store_true',
                       help='Generate videos in parallel')
    parser.add_argument('--workers', type=int, default=3,
                       help='Number of parallel workers (default: 3)')
    parser.add_argument('--output-report', help='Save report to JSON file')
    
    args = parser.parse_args()
    
    # Load configurations
    print(f"Loading batch configuration from: {args.config}")
    configs = load_batch_config(args.config)
    print(f"Found {len(configs)} video configurations")
    
    # Generate videos
    print("\nStarting batch generation...")
    start_time = datetime.now()
    
    results = generate_batch(
        configs,
        parallel=args.parallel,
        max_workers=args.workers
    )
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Print results
    print_results(results)
    print(f"\nTotal time: {duration:.1f} seconds")
    
    # Save report if requested
    if args.output_report:
        report = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration,
            'configs': configs,
            'results': results
        }
        
        with open(args.output_report, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\nReport saved to: {args.output_report}")


if __name__ == "__main__":
    main()