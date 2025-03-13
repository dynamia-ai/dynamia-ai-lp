'use client';

import React, { useEffect, useState } from 'react';

interface GitHubStarsProps {
  repo: string;
  className?: string;
  size?: 'normal' | 'large';
}

const GitHubStars: React.FC<GitHubStarsProps> = ({ 
  repo, 
  className = '',
  size = 'large'
}) => {
  const [stars, setStars] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        
        if (!response.ok) {
          console.error(`GitHub API 请求失败: ${response.status}`);
          return;
        }
        
        const data = await response.json();
        setStars(data.stargazers_count);
      } catch (err) {
        console.error('获取 GitHub Stars 失败:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchStars();
    
    // 每10分钟刷新一次数据
    const intervalId = setInterval(fetchStars, 10 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [repo]);

  // 格式化数字，添加千位分隔符
  const formatNumber = (num: number): string => {
    return num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  };

  // 使用占位符数字，确保组件尺寸一致
  const displayStars = stars !== null ? formatNumber(stars) : '0';
  
  // 使用内联样式代替外部CSS
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: size === 'large' ? '30px' : '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: size === 'large' ? '16px' : '11px',
    fontWeight: 700,
    lineHeight: size === 'large' ? '22px' : '14px',
    overflow: 'hidden',
  };
  
  const btnStyle: React.CSSProperties = {
    float: 'left',
    padding: size === 'large' ? '3px 10px 3px 8px' : '2px 5px 2px 4px',
    color: '#333',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    borderRadius: size === 'large' ? '4px' : '3px',
    backgroundColor: '#eee',
    backgroundImage: 'linear-gradient(to bottom, #fcfcfc 0, #eee 100%)',
    backgroundRepeat: 'no-repeat',
    border: '1px solid #d5d5d5',
    display: 'flex',
    alignItems: 'center',
  };
  
  const icoStyle: React.CSSProperties = {
    width: size === 'large' ? '20px' : '14px',
    height: size === 'large' ? '20px' : '14px',
    marginRight: '4px',
    background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='12 12 40 40'%3e%3cpath fill='%23333' d='M32 13.4c-10.5 0-19 8.5-19 19 0 8.4 5.5 15.5 13 18 1 .2 1.3-.4 1.3-.9v-3.2c-5.3 1.1-6.4-2.6-6.4-2.6-.9-2.1-2.1-2.7-2.1-2.7-1.7-1.2.1-1.1.1-1.1 1.9.1 2.9 2 2.9 2 1.7 2.9 4.5 2.1 5.5 1.6.2-1.2.7-2.1 1.2-2.6-4.2-.5-8.7-2.1-8.7-9.4 0-2.1.7-3.7 2-5.1-.2-.5-.8-2.4.2-5 0 0 1.6-.5 5.2 2 1.5-.4 3.1-.7 4.8-.7 1.6 0 3.3.2 4.7.7 3.6-2.4 5.2-2 5.2-2 1 2.6.4 4.6.2 5 1.2 1.3 2 3 2 5.1 0 7.3-4.5 8.9-8.7 9.4.7.6 1.3 1.7 1.3 3.5v5.2c0 .5.4 1.1 1.3.9 7.5-2.6 13-9.7 13-18.1 0-10.5-8.5-19-19-19z'/%3e%3c/svg%3e") 0 0/100% 100% no-repeat`,
  };
  
  const countContainerStyle: React.CSSProperties = {
    position: 'relative',
    float: 'left',
    marginLeft: size === 'large' ? '6px' : '4px',
    visibility: isLoaded ? 'visible' : 'hidden',
  };
  
  const countStyle: React.CSSProperties = {
    float: 'left',
    padding: size === 'large' ? '3px 10px 3px 8px' : '2px 5px 2px 4px',
    color: '#333',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    borderRadius: size === 'large' ? '4px' : '3px',
    backgroundColor: '#fafafa',
    border: '1px solid #d4d4d4',
    position: 'relative',
    zIndex: 1,
  };
  
  return (
    <span className={className} style={containerStyle}>
      <a 
        href={`https://github.com/${repo}`}
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label={`Star ${repo} on GitHub`}
        style={btnStyle}
      >
        <span style={icoStyle} aria-hidden="true"></span>
        <span>Star</span>
      </a>
      
      <div style={countContainerStyle}>
        {/* 左侧小三角形 - 边框 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: size === 'large' ? '-6px' : '-4px',
          marginTop: size === 'large' ? '-7px' : '-5px',
          borderWidth: size === 'large' ? '7px 7px 7px 0' : '5px 5px 5px 0',
          borderStyle: 'solid',
          borderColor: 'transparent #d4d4d4 transparent transparent',
          zIndex: 0,
        }}></div>
        
        {/* 左侧小三角形 - 内部填充 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: size === 'large' ? '-5px' : '-3px',
          marginTop: size === 'large' ? '-6px' : '-4px',
          borderWidth: size === 'large' ? '6px 6px 6px 0' : '4px 4px 4px 0',
          borderStyle: 'solid',
          borderColor: 'transparent #fafafa transparent transparent',
          zIndex: 2,
        }}></div>
        
        <a 
          href={`https://github.com/${repo}/stargazers`}
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`${displayStars} stargazers on GitHub`}
          style={countStyle}
        >
          {displayStars}
        </a>
      </div>
    </span>
  );
};

export default GitHubStars; 