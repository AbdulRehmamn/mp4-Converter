import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Youtube, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const { toast } = useToast();

  const extractVideoId = (url) => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchVideoInfo = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL or video ID');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);

    const options = {
      method: 'GET',
      url: 'https://ytstream-download-youtube-videos.p.rapidapi.com/dl',
      params: { id: videoId },
      headers: {
        'x-rapidapi-key': '65560d6fd6msha21d1fb7df6c45cp165b1djsn3b50ced25f83',
        'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.title) {
        setVideoInfo(response.data);
        toast({
          title: "Video loaded successfully!",
          description: "Choose a format to download.",
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('Failed to fetch video information. Please check the URL and try again.');
      toast({
        title: "Error",
        description: "Failed to fetch video information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = (downloadUrl, format) => {
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoInfo?.title || 'video'}.${format.mimeType?.includes('mp4') ? 'mp4' : 'webm'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started!",
        description: "Your video download has begun.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not start download. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds) => {
    const num = parseInt(seconds);
    const hours = Math.floor(num / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    const secs = num % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoFormats = () => {
    if (!videoInfo?.formats) return [];
    
    return videoInfo.formats
      .filter(format => format.mimeType?.includes('mp4') && format.height)
      .sort((a, b) => (b.height || 0) - (a.height || 0))
      .slice(0, 5); // Show top 5 quality options
  };

  const getQualityOptions = () => {
    const formats = getVideoFormats();
    return formats.map(format => ({
      value: format.itag.toString(),
      label: format.qualityLabel || `${format.height}p`,
      format: format
    }));
  };

  const getSelectedFormat = () => {
    const formats = getVideoFormats();
    return formats.find(format => format.itag.toString() === selectedQuality);
  };

  const getQualityFormats = () => {
    if (!videoInfo?.formats) return { '480p': null, '720p': null, '1080p': null };
    
    const videoFormats = videoInfo.formats.filter(format => 
      format.mimeType?.includes('mp4') && format.height
    );
    
    const findClosestQuality = (targetHeight) => {
      return videoFormats
        .filter(format => format.height && format.height <= targetHeight + 50)
        .sort((a, b) => Math.abs((a.height || 0) - targetHeight) - Math.abs((b.height || 0) - targetHeight))[0] || null;
    };
    
    return {
      '480p': findClosestQuality(480),
      '720p': findClosestQuality(720),
      '1080p': findClosestQuality(1080)
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <Youtube size={32} />
          <h1 className="text-3xl font-bold">YouTube Video Downloader</h1>
        </div>
        <p className="text-gray-600">Enter a YouTube URL to download videos in MP4 format</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Video</CardTitle>
          <CardDescription>
            Paste a YouTube URL or video ID to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=... or video ID"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={fetchVideoInfo} 
              disabled={loading || !url.trim()}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Fetch Video'
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {videoInfo && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                {videoInfo.thumbnail && videoInfo.thumbnail[0] && (
                  <img
                    src={videoInfo.thumbnail[videoInfo.thumbnail.length - 1]?.url}
                    alt={videoInfo.title}
                    className="w-48 h-36 object-cover rounded-lg shadow-md"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-semibold line-clamp-2">{videoInfo.title}</h2>
                  <p className="text-gray-600">{videoInfo.channelTitle}</p>
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>Duration: {formatDuration(videoInfo.lengthSeconds)}</span>
                  </div>
                  {videoInfo.keywords && videoInfo.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {videoInfo.keywords.slice(0, 5).map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Download Options</h3>
                
                <div className="space-y-3">
                  <h4 className="text-md font-medium">Quick Download</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(getQualityFormats()).map(([quality, format]) => (
                      <Button
                        key={quality}
                        onClick={() => format && downloadVideo(format.url, format)}
                        disabled={!format}
                        variant={format ? "default" : "outline"}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                        {quality} {format ? 'MP4' : '(Not Available)'}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quality-select">Custom Quality Select</Label>
                    <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                      <SelectTrigger id="quality-select">
                        <SelectValue placeholder="Choose video quality" />
                      </SelectTrigger>
                      <SelectContent>
                        {getQualityOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{option.label}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {Math.round((option.format.bitrate || 0) / 1000)}kbps
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        const format = getSelectedFormat();
                        if (format) {
                          downloadVideo(format.url, format);
                        }
                      }}
                      disabled={!selectedQuality}
                      className="w-full flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download Selected Quality
                    </Button>
                  </div>
                </div>

                {selectedQuality && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Selected:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getSelectedFormat()?.qualityLabel || `${getSelectedFormat()?.height}p`}
                        </Badge>
                        <span className="text-gray-600">
                          MP4 • {Math.round((getSelectedFormat()?.bitrate || 0) / 1000)}kbps
                          {getSelectedFormat()?.fps && ` • ${getSelectedFormat()?.fps}fps`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-md font-medium">All Available Formats</h4>
                  <div className="grid gap-2">
                    {getVideoFormats().map((format, index) => (
                      <div
                        key={format.itag}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {format.qualityLabel || `${format.height}p`}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            MP4 • {Math.round((format.bitrate || 0) / 1000)}kbps
                            {format.fps && ` • ${format.fps}fps`}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => downloadVideo(format.url, format)}
                          className="flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubeDownloader;