import { useState } from 'react';
import './DigitalPassCard.css';

interface DigitalPassCardProps {
  memberName: string;
  qrCode: string;
  qrDataUrl: string;
  onQRClick: () => void;
}

export default function DigitalPassCard({ memberName, qrCode, qrDataUrl, onQRClick }: DigitalPassCardProps) {
  const [flipped, setFlipped] = useState(false);

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  
  return (
    <div className="digital-pass-wrapper">
      <div className="output">
        <div className="wrap-colors-1">
          <div className="bg-colors"></div>
        </div>
        <div className="wrap-colors-2">
          <div className="bg-colors"></div>
        </div>
        <div className="cover"></div>
      </div>
      
      <div className="area">
        <div className="area-wrapper">
          <div className="ticket-mask">
            <div className="ticket" onClick={() => setFlipped(f => !f)}>
              <div className={`ticket-flip-container${flipped ? ' flipped' : ''}`}>
                <div className="float">
                  <div className="front">
                    <div className="ticket-body">
                      <div className="reflex"></div>
                      <svg
                        className="icon-cube"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          style={{ "--i": 1 } as React.CSSProperties}
                          className="path-center"
                          d="M12 12.75L14.25 11.437M12 12.75L9.75 11.437M12 12.75V15"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 2 } as React.CSSProperties}
                          className="path-t"
                          d="M9.75 3.562L12 2.25L14.25 3.563"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 3 } as React.CSSProperties}
                          className="path-tr"
                          d="M21 7.5L18.75 6.187M21 7.5V9.75M21 7.5L18.75 8.813"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 4 } as React.CSSProperties}
                          className="path-br"
                          d="M21 14.25V16.5L18.75 17.813"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 5 } as React.CSSProperties}
                          className="path-b"
                          d="M12 21.75L14.25 20.437M12 21.75V19.5M12 21.75L9.75 20.437"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 6 } as React.CSSProperties}
                          className="path-bl"
                          d="M5.25 17.813L3 16.5V14.25"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          style={{ "--i": 7 } as React.CSSProperties}
                          className="path-tl"
                          d="M3 7.5L5.25 6.187M3 7.5L5.25 8.813M3 7.5V9.75"
                          stroke="black"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                      <header>
                        <div className="ticket-name">
                          <div>
                            <span style={{ "--i": 1 } as React.CSSProperties}>D</span>
                            <span style={{ "--i": 2 } as React.CSSProperties}>I</span>
                            <span style={{ "--i": 3 } as React.CSSProperties}>G</span>
                            <span style={{ "--i": 4 } as React.CSSProperties}>I</span>
                            <span style={{ "--i": 5 } as React.CSSProperties}>T</span>
                            <span style={{ "--i": 6 } as React.CSSProperties}>A</span>
                            <span style={{ "--i": 7 } as React.CSSProperties}>L</span>
                          </div>
                          <div>
                            <span className="bold" style={{ "--i": 8 } as React.CSSProperties}>P</span>
                            <span className="bold" style={{ "--i": 9 } as React.CSSProperties}>A</span>
                            <span className="bold" style={{ "--i": 10 } as React.CSSProperties}>S</span>
                            <span className="bold" style={{ "--i": 11 } as React.CSSProperties}>S</span>
                          </div>
                        </div>
                        <div className="barcode"></div>
                      </header>
                      <div className="contents">
                        <div className="event">
                          <div>
                            <span className="bold">Plus</span>
                            <span>1</span>
                          </div>
                          <div>REWARDS</div>
                        </div>
                        <div className="number">#{qrCode}</div>
                        <div className="qrcode" onClick={onQRClick} style={{ cursor: 'pointer' }}>
                          <img src={qrDataUrl} alt="QR Code" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="back">
                    <div className="ticket-body">
                      <div className="reflex"></div>
                      <header>
                        <div className="ticket-name">
                          <div>
                            <span style={{ "--i": 1 } as React.CSSProperties}>D</span>
                            <span style={{ "--i": 2 } as React.CSSProperties}>I</span>
                            <span style={{ "--i": 3 } as React.CSSProperties}>G</span>
                            <span style={{ "--i": 4 } as React.CSSProperties}>I</span>
                            <span style={{ "--i": 5 } as React.CSSProperties}>T</span>
                            <span style={{ "--i": 6 } as React.CSSProperties}>A</span>
                            <span style={{ "--i": 7 } as React.CSSProperties}>L</span>
                          </div>
                          <b>
                            <span className="bold" style={{ "--i": 8 } as React.CSSProperties}>P</span>
                            <span className="bold" style={{ "--i": 9 } as React.CSSProperties}>A</span>
                            <span className="bold" style={{ "--i": 10 } as React.CSSProperties}>S</span>
                            <span className="bold" style={{ "--i": 11 } as React.CSSProperties}>S</span>
                          </b>
                        </div>
                        <time dateTime={`${year}-${month}-${day}`}>
                          <span style={{ "--i": 11 } as React.CSSProperties} className="bold">{day[0]}</span>
                          <span style={{ "--i": 12 } as React.CSSProperties} className="bold">{day[1]}</span>
                          <span style={{ "--i": 13 } as React.CSSProperties} className="slash">/</span>
                          <span style={{ "--i": 14 } as React.CSSProperties}>{month[0]}</span>
                          <span style={{ "--i": 15 } as React.CSSProperties}>{month[1]}</span>
                          <span style={{ "--i": 16 } as React.CSSProperties} className="slash">/</span>
                          <span style={{ "--i": 17 } as React.CSSProperties}>{year[0]}</span>
                          <span style={{ "--i": 18 } as React.CSSProperties}>{year[1]}</span>
                          <span style={{ "--i": 19 } as React.CSSProperties}>{year[2]}</span>
                          <span style={{ "--i": 20 } as React.CSSProperties}>{year[3]}</span>
                        </time>
                      </header>
                      <div className="contents">
                        <div className="qrcode" onClick={onQRClick} style={{ cursor: 'pointer' }}>
                          <img src={qrDataUrl} alt="Member QR Code" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="noise">
        <svg height="100%" width="100%">
          <defs>
            <pattern height="500" width="500" patternUnits="userSpaceOnUse" id="noise-pattern">
              <filter y="0" x="0" id="noise">
                <feTurbulence stitchTiles="stitch" numOctaves="3" baseFrequency="0.65" type="fractalNoise"></feTurbulence>
                <feBlend mode="screen"></feBlend>
              </filter>
              <rect filter="url(#noise)" height="500" width="500"></rect>
            </pattern>
          </defs>
          <rect fill="url(#noise-pattern)" height="100%" width="100%"></rect>
        </svg>
      </div>
    </div>
  );
}
