import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../src/services/supabaseClient";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Get initial user
    getCurrentUser();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Initial messages fetch
    fetchMessages();

    // Set up real-time subscription
    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      messageSubscription?.unsubscribe();
    };
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  async function fetchMessages() {
    try {
      if (!currentUser) return;

      // Check if profile exists, if not create it
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert([
          {
            id: currentUser.id,
            name: currentUser.email?.split("@")[0] || "User",
            is_admin: false,
          },
        ]);
      }

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!sender_id(id, name),
          receiver:profiles!receiver_id(id, name)
        `
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error details:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setLoading(true);

      const { data: adminUser, error: adminError } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true)
        .single();

      if (adminError) {
        const { error } = await supabase.from("messages").insert([
          {
            content: newMessage.trim(),
            sender_id: currentUser.id,
            receiver_id: null,
          },
        ]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("messages").insert([
          {
            content: newMessage.trim(),
            sender_id: currentUser.id,
            receiver_id: currentUser.id === adminUser.id ? null : adminUser.id,
          },
        ]);
        if (error) throw error;
      }

      setNewMessage("");
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  }

  const renderMessage = ({ item }) => {
    const isOwnMessage = currentUser && item.sender_id === currentUser.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageSender}>
          {item.sender?.name || "Unknown"}
        </Text>
        <Text
          style={[
            styles.messageContent,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text>Please sign in to view messages</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#0084ff",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e9ecef",
  },
  messageSender: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 16,
  },
  ownMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 10,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#0084ff",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
};

export default ChatComponent;
